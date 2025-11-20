// src/pages/Home.tsx (updated)
import { useState } from "react";
import {
    Button,
    Typography,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";

import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const [mode, setMode] = useState("cpu");
    const navigate = useNavigate();

    const startGame = async () => {
        const config = {
            player2_type: mode === "cpu" ? "cpu" : "human",
        };

        const state = await api.createGame(config);
        navigate(`/game/${state.game_id}`);
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <Typography variant="h1" className="home-title">
                    Connect 4
                </Typography>
                <Typography variant="h6" className="home-subtitle">
                    Choose your game mode and start playing!
                </Typography>

                <FormControl fullWidth sx={{ my: 3 }}>
                    <Select
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        className="enhanced-select"
                    >
                        <MenuItem value="cpu">Player vs CPU</MenuItem>
                        <MenuItem value="pvp">Player vs Player</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    onClick={startGame}
                    className="enhanced-button"
                    fullWidth
                >
                    Start Game
                </Button>
            </div>
        </div>
    );
}