// src/App.tsx (updated)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GamePage from "./pages/Game";
import "./index.css"; // Make sure this import is here

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:id" element={<GamePage />} />
            </Routes>
        </BrowserRouter>
    );
}