from rest_framework import serializers

class AnalyzeTextSerializer(serializers.Serializer):
    """
    Serializer for the input text to be analyzed.
    """
    text = serializers.CharField(
        min_length=10,
        max_length=5000,
        required=True,
        help_text="The text content to be analyzed for sentiment."
    )

class AISentimentAnalysisResultSerializer(serializers.Serializer):
    """
    Serializer for returning the results of a sentiment analysis.
    """
    sentiment_label = serializers.CharField()
    sentiment_score = serializers.FloatField()
    confidence_score = serializers.FloatField()
    keywords = serializers.ListField(child=serializers.CharField(), required=False) 