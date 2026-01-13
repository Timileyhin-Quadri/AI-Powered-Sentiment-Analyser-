# analyzer.py
import pandas as pd
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import re

class SentimentEngine:
    def __init__(self):
        # 🚀 SWITCHED MODEL: This is state-of-the-art for Nigerian languages
        self.model_name = "Davlan/naija-twitter-sentiment-afriberta-large"
        
        # Load specific tokenizer and model to handle the unique labels
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        
        self.pipe = pipeline("sentiment-analysis", model=self.model, tokenizer=self.tokenizer, max_length=512, truncation=True)

    def clean_text(self, text):
        text = re.sub(r'@\w+', '@user', str(text))
        text = re.sub(r'http\S+', 'http', text)
        return text

    def process_dataframe(self, df):
        if df.empty: return df
        
        df['clean_text'] = df['text'].apply(self.clean_text)
        results = self.pipe(df['clean_text'].tolist())
        
        # Format results
        probs = [r['score'] for r in results]
        labels = [r['label'] for r in results]
        
        df['confidence'] = probs
        
        # 🇳🇬 MAP NAIJASENTI LABELS
        # This model returns 'positive', 'negative', 'neutral' directly (lowercase)
        label_map = {
            'positive': 'Positive',
            'negative': 'Negative',
            'neutral':  'Neutral'
        }
        
        # Map labels (handling cases where model might output 'LABEL_0' etc)
        df['sentiment'] = [label_map.get(l.lower(), 'Neutral') for l in labels]
        
        return df