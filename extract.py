import pandas as pd
import json

df = pd.read_excel(r'C:\Users\jeanc\Documents\DATASETCORRIGE.xlsx')

labels = df.iloc[:, -1].dropna().unique().tolist()
columns = df.columns.tolist()

with open('masters.json', 'w', encoding='utf-8') as f:
    json.dump({'columns': columns, 'masters': labels}, f, ensure_ascii=False, indent=2)
