// src/pages/Game.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CircularProgress, Typography, Button } from "@mui/material";
import { useEffect, useState } from "react";

import { useGame } from "../hooks/useGame";
import Board from "../components/Board";
import GameInfo from "../components/GameInfo";
import GameOverModal from "../components/GameOverModal";

export default function GamePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { state, makeMove, setInitialState } = useGame(id || null);

    const [gameOver, setGameOver] = useState(false);
    const [endTime, setEndTime] = useState<number | null>(null);

    // Initialize state from navigation if available - ONLY ONCE
    useEffect(() => {
        const navigationState = location.state as { initialGameState?: any };
        if (navigationState?.initialGameState && !state) {
            // Only set if we don't have state yet
            console.log("Setting initial state from navigation");
            setInitialState?.(navigationState.initialGameState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    // Update body class based on current player
    useEffect(() => {
        if (state) {
            if (state.status === "win" || state.status === "draw") {
                document.body.className = "game-over";
            } else if (state.current_player === "player1") {
                document.body.className = "player1-turn";
            } else {
                document.body.className = "player2-turn";
            }
        }

        return () => {
            document.body.className = "";
        };
    }, [state]);

    // Detect game end
    useEffect(() => {
        if (!state) return;

        if (state.status === "win" || state.status === "draw") {
            setGameOver(true);
            setEndTime(prev => prev ?? Date.now());
        }
    }, [state]);

    const elapsed =
        state && endTime && state.created_at
            ? (endTime - new Date(state.created_at).getTime()) / 1000
            : 0;

    const restartGame = () => {
        navigate("/");
    };

    if (!state) {
        return (
            <div className="game-container">
                <CircularProgress className="enhanced-spinner" size={60} />
                <Typography sx={{ mt: 2 }}>
                    Loading game...
                </Typography>
            </div>
        );
    }

    return (
        <div className="game-container">
            <div className="game-header">
                <Typography variant="h1" className="game-title">
                    Connect 4
                </Typography>
            </div>

            <GameInfo state={state} />
            <Board
                board={state.board}
                onColumnClick={makeMove}
            />

            <GameOverModal
                open={gameOver}
                winner={state.winner}
                elapsedSeconds={elapsed}
                moves={[]} // History not available from backend
                onClose={() => setGameOver(false)}
                onRestart={restartGame}
            />

            {state.config.player2_type === "cpu" && state.current_player === "player2" && state.status === "in_progress" && (
                <Typography sx={{ mt: 2, textAlign: "center", fontStyle: "italic" }}>
                    ⏳ Waiting for AI move... (AI service must be running)
                </Typography>
            )}
        </div>
    );
}