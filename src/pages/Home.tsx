// src/pages/Home.tsx
import { useState } from "react";
import {
    Button,
    Typography,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Home() {
    const [mode, setMode] = useState<"cpu" | "human">("cpu");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const startGame = async () => {
        setLoading(true);
        try {
            const config = {
                player2_type: mode,
            };

            // Create game directly
            const backendResponse = await api.createGame(config);

            // Pass the initial game state via navigation state
            navigate(`/game/${backendResponse.id}`, {
                state: { initialGameState: backendResponse }
            });
        } catch (error) {
            console.error("Error creating game:", error);
            alert("Failed to create game. Please try again.");
        } finally {
            setLoading(false);
        }
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
                        onChange={e => setMode(e.target.value as "cpu" | "human")}
                        className="enhanced-select"
                        disabled={loading}
                    >
                        <MenuItem value="cpu">Player vs CPU</MenuItem>
                        <MenuItem value="human">Player vs Player</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    onClick={startGame}
                    className="enhanced-button"
                    fullWidth
                    disabled={loading}
                >
                    {loading ? "Creating Game..." : "Start Game"}
                </Button>
            </div>
        </div>
    );
}