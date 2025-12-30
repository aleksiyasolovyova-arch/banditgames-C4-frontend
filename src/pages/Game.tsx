// src/pages/Game.tsx
import { useParams, useNavigate } from "react-router-dom";
import { CircularProgress, Typography, Button, Alert, TextField, Box, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import Board from "../components/Board";
import GameInfo from "../components/GameInfo";
import GameOverModal from "../components/GameOverModal";
import MoveSuggestionDisplay from "../components/MoveSuggestion";
import WinProbabilityDisplay from "../components/WinProbabilityDisplay";


export default function GamePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, makeMove, createGame, loading, gameExists, mlSuggestion, mlAvailable, winProbLoading, winProbMove, winProb } = useGame(id || null);

    const [gameOver, setGameOver] = useState(false);
    const [endTime, setEndTime] = useState<number | null>(null);

    // Form state for creating game
    const [player1Id, setPlayer1Id] = useState("");
    const [player2Id, setPlayer2Id] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

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

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!player1Id.trim() || !player2Id.trim()) {
            setCreateError("Both player IDs are required");
            return;
        }

        if (!id) {
            setCreateError("Game ID not found in URL");
            return;
        }

        setCreating(true);
        setCreateError("");

        try {
            await createGame(id, player1Id.trim(), player2Id.trim());
        } catch (error: any) {
            console.error("Error creating game:", error);
            setCreateError(error.response?.data?.message || "Failed to create game. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="game-container">
                <CircularProgress className="enhanced-spinner" size={60} />
                <Typography sx={{ mt: 2, color: 'white' }}>
                    Loading game...
                </Typography>
            </div>
        );
    }

    // Game doesn't exist - show form to create it
    if (!gameExists) {
        return (
            <div className="home-container">
                <div className="home-card">
                    <Typography variant="h1" className="home-title">
                        Connect 4
                    </Typography>
                    <Typography variant="h6" className="home-subtitle">
                        Create Game: {id}
                    </Typography>

                    <Box component="form" onSubmit={handleCreateGame} sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            label="Player 1 ID"
                            value={player1Id}
                            onChange={(e) => setPlayer1Id(e.target.value)}
                            disabled={creating}
                            sx={{ mb: 2 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Player 2 ID"
                            value={player2Id}
                            onChange={(e) => setPlayer2Id(e.target.value)}
                            disabled={creating}
                            sx={{ mb: 3 }}
                            required
                        />

                        {createError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {createError}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            className="enhanced-button"
                            fullWidth
                            disabled={creating}
                        >
                            {creating ? "Creating Game..." : "Create Game"}
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => navigate("/")}
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={creating}
                        >
                            Back to Home
                        </Button>
                    </Box>
                </div>
            </div>
        );
    }

    // Game exists - show game board
    if (!state) {
        return (
            <div className="game-container">
                <CircularProgress className="enhanced-spinner" size={60} />
                <Typography sx={{ mt: 2, color: 'white' }}>
                    Loading game state...
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

                {/* ML API Status Indicator */}
                {!mlAvailable && (
                    <Alert
                        severity="info"
                        sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}
                    >
                         ML API not available - move suggestions disabled.
                        Start the ML API at localhost:8001 to enable AI analysis.
                    </Alert>
                )}
            </div>

            <GameInfo state={state} />

            {/* ML Move Suggestion Display */}
{mlAvailable && (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",          // mobile: stacked
        md: "1.2fr 0.8fr"   // desktop: side-by-side
      },
      gap: 3,
      width: "100%",
      maxWidth: "1200px",
      mx: "auto",
      my: 3
    }}
  >
    {mlSuggestion.playerColor && (
      <MoveSuggestionDisplay
        lastMove={mlSuggestion.lastMove}
        suggestedMove={mlSuggestion.suggestedMove}
        topMoves={mlSuggestion.topMoves}
        isLoading={mlSuggestion.isLoading}
        playerColor={mlSuggestion.playerColor}
      />
    )}

    {winProb && (
      <WinProbabilityDisplay
        probabilities={winProb}
        isLoading={winProbLoading}
        moveIndex={winProbMove}
      />
    )}
  </Box>
)}


            <Board
                board={state.board}
                onColumnClick={makeMove}
                disabled={state.status !== "in_progress"}
            />

            <GameOverModal
                open={gameOver}
                winner={state.winner}
                elapsedSeconds={elapsed}
                moveCount={state.moveCount || 0}
                onClose={() => setGameOver(false)}
                onRestart={restartGame}
            />
        </div>
    );
}