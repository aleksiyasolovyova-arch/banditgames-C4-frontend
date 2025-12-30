// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GamePage from "./pages/Game";
import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Home/Info page */}
                <Route path="/" element={<Home />} />

                {/* Game page - gameId comes from platform */}
                <Route path="/games/:id" element={<GamePage />} />
            </Routes>
        </BrowserRouter>
    );
}