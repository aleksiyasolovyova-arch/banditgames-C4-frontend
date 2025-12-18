import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from "@mui/material";
import Confetti from "react-confetti";

interface Props {
    open: boolean;
    winner: string | null;
    elapsedSeconds: number;
    moveCount: number;
    onClose: () => void;
    onRestart: () => void;
}

export default function GameOverModal({
                                          open,
                                          winner,
                                          elapsedSeconds,
                                          moveCount,
                                          onClose,
                                          onRestart,
                                      }: Props) {
    const winnerColor =
        winner === "player1" ? "#ff5252" : winner === "player2" ? "#ffee58" : "#888";

    const winnerName =
        winner === "player1" ? "PLAYER 1" :
            winner === "player2" ? "PLAYER 2 / CPU" :
                null;

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
                        {winnerName ? `Winner: ${winnerName}` : "It's a Draw!"}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Game Duration: {elapsedSeconds.toFixed(1)} seconds
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Total Moves: {moveCount}
                    </Typography>

                    <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {winner
                                ? "🎉 Congratulations on your victory!"
                                : "🤝 Well played! The board is full."}
                        </Typography>
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