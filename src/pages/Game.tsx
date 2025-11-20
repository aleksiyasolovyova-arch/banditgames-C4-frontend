// src/pages/Game.tsx (updated)
import { useParams } from "react-router-dom";
import {CircularProgress, Typography} from "@mui/material";
import { useEffect, useState } from "react";

import { useGame } from "../hooks/useGame";
import Board from "../components/Board";
import GameInfo from "../components/GameInfo";
import GameOverModal from "../components/GameOverModal";
import { api } from "../api/api";

export default function GamePage() {
    const { id } = useParams();
    const { state, makeMove } = useGame(id!);

    const [gameOver, setGameOver] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [endTime, setEndTime] = useState<number | null>(null);

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

    // Fetch history + detect game end
    useEffect(() => {
        if (!state) return;

        api.getHistory(id!).then(setHistory);

        if (state.status === "win" || state.status === "draw") {
            setGameOver(true);
            setEndTime(prev => prev ?? Date.now());
        }
    }, [state, id]);

    const elapsed =
        state && endTime
            ? (endTime - new Date(state.created_at).getTime()) / 1000
            : 0;

    const restartGame = () => {
        window.location.href = "/";
    };

    if (!state) {
        return (
            <div className="game-container">
                <CircularProgress className="enhanced-spinner" size={60} />
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
            <Board board={state.board} onColumnClick={makeMove} />

            <GameOverModal
                open={gameOver}
                winner={state.winner}
                elapsedSeconds={elapsed}
                moves={history}
                onClose={() => setGameOver(false)}
                onRestart={restartGame}
            />
        </div>
    );
}