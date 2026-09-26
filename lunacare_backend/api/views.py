from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ApiDemoModel
from .serializers import DemoSerializer
from django.conf import settings
from django.http import HttpResponse
from rest_framework.parsers import JSONParser
import logging

logger = logging.getLogger(__name__)

class DemoApiView(APIView):
    def get(self, request):
        return Response(DemoSerializer(ApiDemoModel.objects.all(), many=True).data)

class OpenAIChatView(APIView):
    def post(self, request):
        user_input = str(request.data.get("user_input", "")).strip()
        if not user_input:
            return Response({"error": "No user input provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            bot = getattr(settings, "LUNA_CARE_BOT", None)
            if bot:
                answer = bot.generate_response(user_input)
                return Response({"response": getattr(answer, "content", str(answer))})
            api_key = getattr(settings, "OPENAI_API_KEY", "")
            if not api_key:
                return Response({"response": "Luna is offline until OPENAI_API_KEY is configured in lunacare_backend/.env."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            from openai import OpenAI
            response = OpenAI(api_key=api_key).chat.completions.create(
                model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are Luna, a warm postpartum wellness assistant. Give supportive general information, never diagnose, and recommend professional care for urgent concerns."},
                    {"role": "user", "content": user_input}
                ], max_tokens=500, temperature=0.7)
            return Response({"response": response.choices[0].message.content or "Please try again."})
        except Exception:
            logger.exception("Chat response failed")
            return Response({"error": "An error occurred while processing your request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TextToSpeechView(APIView):
    parser_classes = [JSONParser]
    def post(self, request, format=None):
        text = str(request.data.get("text", "")).strip()
        if not text:
            return Response({"error": "No text provided."}, status=status.HTTP_400_BAD_REQUEST)
        api_key = getattr(settings, "OPENAI_API_KEY", "")
        if not api_key:
            return Response({"error": "Text-to-speech is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            from openai import OpenAI
            audio = OpenAI(api_key=api_key).audio.speech.create(model="tts-1", voice="alloy", input=text)
            return HttpResponse(audio.content, content_type="audio/mpeg")
        except Exception:
            logger.exception("Speech generation failed")
            return Response({"error": "Unable to generate audio."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
