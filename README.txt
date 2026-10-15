NPTEL Science of Happiness Practice Website

Files:
- index.html: website interface
- style.css: responsive styling
- app.js: quiz behaviour, score, timer, review and local progress
- questions.json: 120 questions parsed from the eight uploaded Week 1–8 assignment PDFs

How to run:
1. Keep all four files in the same folder.
2. For best compatibility, open the folder in VS Code and use the Live Server extension, or run:
   python -m http.server 8000
3. Open http://localhost:8000 in your browser.
4. Internet is not needed after the files are downloaded (fonts may fall back to system fonts).

Features:
- All 120 questions, grouped by week and lecture
- Shuffle questions and options or follow PDF order
- Practice mode with instant feedback
- Mock exam mode with answers revealed at the end
- Optional timer
- Wrong-answer review and not-yet-mastered filter
- Saves answer history in this browser using localStorage

Important answer-key note:
The PDFs say “Please refer to Lecture…” and do not include explicit answer keys or detailed explanations. Suggested correct answers are inferred from the question wording and general course context. Please double-check them against your lecture notes, especially for questions whose answer depends on lecture-specific framing. The original question and option wording has been retained as closely as possible.
