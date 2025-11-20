import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Collapse,
    IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import Confetti from "react-confetti";

interface Props {
    open: boolean;
    winner: string | null;
    elapsedSeconds: number;
    moves: any[];
    onClose: () => void;
    onRestart: () => void;
}

export default function GameOverModal({
                                          open,
                                          winner,
                                          elapsedSeconds,
                                          moves,
                                          onClose,
                                          onRestart,
                                      }: Props) {
    const [showHistory, setShowHistory] = useState(false);

    const winnerColor =
        winner === "player1" ? "#ff5252" : winner === "player2" ? "#ffee58" : "#888";

    return (
        <>
            {winner && open && (
                <Confetti
                    numberOfPieces={400}
                    recycle={false}
                    gravity={0.15}
                    tweenDuration={3000}
                />
            )}

            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        animation: "fadeIn 0.4s ease",
                        backdropFilter: "blur(6px)",
                    },
                }}
            >
                <DialogTitle sx={{ textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: "bold", color: winnerColor }}>
                        {winner ? `Winner: ${winner.toUpperCase()}` : "It's a Draw!"}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Elapsed Time: {elapsedSeconds.toFixed(1)} seconds
                    </Typography>

                    <Box>
                        <IconButton onClick={() => setShowHistory(!showHistory)}>
                            <ExpandMoreIcon
                                sx={{
                                    transform: showHistory ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "0.2s",
                                }}
                            />
                        </IconButton>
                        <Typography variant="body1">Show Move History</Typography>

                        <Collapse in={showHistory}>
                            <Box
                                sx={{
                                    mt: 2,
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    background: "#f5f5f5",
                                    borderRadius: "8px",
                                    p: 2,
                                }}
                            >
                                {moves.length === 0 && <Typography>No moves recorded.</Typography>}

                                {moves.map((m: any) => (
                                    <Typography key={m.move_index}>
                                        Move {m.move_index + 1}: Player {m.player} → Column {m.column}
                                    </Typography>
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button variant="outlined" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="contained" onClick={onRestart}>
                        Play Again
                    </Button>
                </DialogActions>
            </Dialog>

            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
            </style>
        </>
    );
}
