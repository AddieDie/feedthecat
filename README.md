# Feed the Cat

A tiny, cozy interactive static site for cat lovers — feed, play with, and care for a virtual cat. Designed to be minimal, responsive and pleasant to use.

Demo

- Open `index.html` in your browser or serve the folder with a local static server.

Features

- Feed, Buy, Pet, Play, Give Treat and Ignore actions.
- Hunger and Happiness meters with smooth animations.
- Dark mode with theme persistence.
- Settings panel to tweak hunger tick speed, feed amount, and treat potency.
- State saved to localStorage so your cat persists between visits.

Quick start

1. Clone or download this repository.
2. Open `index.html` in your browser for a quick preview.

Recommended local preview (Node.js)

```powershell
# from project root
npx serve . -l 3000
# then open http://localhost:3000
```

Or use VS Code Live Server extension.

How to use

- Buy Food to add items to the pantry. Feed consumes food and reduces hunger.
- Pet and Play increase happiness; playing raises hunger slightly.
- Give Treat consumes food but gives a larger happiness boost.
- Ignore lowers happiness and mildly increases hunger (simulates neglect).
- Use the ⚙️ settings button in the header to change tick speed, feed amount and treat potency. Save to persist.

Development notes

- Files:
  - `index.html` — markup and UI
  - `src/css/style.css` — styles and themes
  - `src/js/app.js` — game logic and persistence
- The app uses vanilla JS and CSS (no build step). Modify and open `index.html` to test.
- Settings and state are stored in localStorage under keys `feed-the-cat:v1` and `feed-the-cat:settings`.

Extending the project

- Add more actions (sleep, groom), achievements, or animations.
- Add audio feedback when feeding or playing.
- Add unit tests for the state logic.

License

This project is provided under the MIT License. See `LICENSE` for details.

# Feed the Cat

A small interactive static site for cat lovers. Click "Buy Food" to add food to the pantry, then "Feed the Cat" to reduce the cat's hunger. State is saved in your browser's localStorage.

How to open locally:

1. Open `index.html` in a browser (double-click the file or use a local dev server).
2. For a better dev experience, serve the folder with a static server. Example (if you have Python):

```powershell
# from project root
python -m http.server 8000
# then open http://localhost:8000
```

Files created:

- `index.html` — main page
- `src/css/style.css` — styles
- `src/js/app.js` — interactive logic

New features added:

- Dark mode: toggle the moon button in the header; theme choice is saved.
- Happiness meter: pet or play with the cat to increase happiness; it decays slightly over time.
- "Pet the Cat" and "Play with Cat" buttons — increase happiness (play also raises hunger a bit).

**✅ These features persist between reloads using localStorage.**
