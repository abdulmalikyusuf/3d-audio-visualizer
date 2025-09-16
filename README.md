# React-Three-Fiber 3D Audio Visualizer

This is a React Three Fiber version of _“Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API”_ by **Filip Zrnzevic**, originally published on Codrops in June 2025.  
👉 [Read the original article](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/)

---

## ✨ Features

- Audio-reactive 3D orb with glow/haze and distortion responding to music
- Real-time audio analysis (frequency spectrum, average levels, peaks) via **Web Audio API**
- Custom shaders for vertex distortion + fresnel glow effects
- Smooth animations and transitions (powered by GSAP in the original)
- React component architecture for better state & props management
- Responsive and works across device sizes

---

## 🙏 Acknowledgements & Credits

- **Original concept & tutorial**: _“Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API”_ by **Filip Zrnzevic**, Codrops, June 18, 2025  
  👉 [Codrops Article](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/)
- Shaders, distortion ideas, fresnel glow, and audio reactivity are directly inspired by the original work.

---

## 🔄 Differences in This Port

- Rewritten using **React + React Three Fiber** instead of vanilla Three.js
- React component structure (Canvas, shaders, controls, UI separation)
- Optional integration with React UI libraries for controls
- Performance tweaks and React-friendly state management
- Easier extensibility for React projects

---

## 🚀 Getting Started

Clone and install:

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev     # or npm start / yarn start
```

Then open http://localhost:3000 in your browser.
Load or play audio to see the orb react in real time.

## 🎛 Controls

| Control                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| Distortion / Spikiness    | Adjusts how much the orb vertices deform based on audio + noise |
| Resolution / Tessellation | Controls sphere subdivisions for smoothness                     |
| Sensitivity               | Scales how strongly audio affects visuals                       |
| Camera / Zoom             | Adjusts scene perspective and transitions                       |
| UI Panels                 | Draggable sliders/panels for real-time tuning (if implemented)  |

---

## 📦 Dependencies

- [React](https://reactjs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [@react-three/drei](https://github.com/pmndrs/drei) _(if used)_
- [GSAP](https://greensock.com/gsap/) _(for animations, optional)_
- Web Audio API _(native browser API)_
- GLSL shaders

---

## 📌 Attribution

This project is a port/adaptation of the Codrops tutorial:  
**“Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API”** by **Filip Zrnzevic**  
👉 [https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/)
