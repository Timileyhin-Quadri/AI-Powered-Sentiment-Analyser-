# analyzer.py
import pandas as pd
from transformers import pipeline, AutoConfig
import torch
import re

class SentimentEngine:
    def __init__(self):
        self.model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        self.pipe = pipeline("sentiment-analysis", model=self.model_name, tokenizer=self.model_name, max_length=512, truncation=True)

    def clean_text(self, text):
        text = re.sub(r'@\w+', '@user', str(text))
        text = re.sub(r'http\S+', 'http', text)
        return text

    def process_dataframe(self, df):
        if df.empty: return df
        
        # Clean
        df['clean_text'] = df['text'].apply(self.clean_text)
        
        # Predict
        results = self.pipe(df['clean_text'].tolist())
        
        # Format results
        probs = [r['score'] for r in results]
        labels = [r['label'] for r in results]
        
        df['sentiment'] = labels
        df['confidence'] = probs
        
        # Normalize labels (RoBERTa output might be 'positive' or 'LABEL_2')
        label_map = {
            'LABEL_0': 'Negative', 'negative': 'Negative',
            'LABEL_1': 'Neutral', 'neutral': 'Neutral',
            'LABEL_2': 'Positive', 'positive': 'Positive'
        }
        df['sentiment'] = df['sentiment'].map(label_map).fillna('Neutral')
        
        return df