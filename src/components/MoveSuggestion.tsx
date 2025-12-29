// src/components/MoveSuggestion.tsx
import { Box, Typography, Chip, Paper, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface MoveSuggestion {
    move: number;
    confidence: number;
}

interface Props {
    lastMove: number | null;  // Column of last move made
    suggestedMove: number | null;  // ML suggested best move
    topMoves: MoveSuggestion[];  // Top K suggested moves
    isLoading: boolean;
    playerColor: string;  // 'player1' or 'player2'
}

export default function MoveSuggestionDisplay({
    lastMove,
    suggestedMove,
    topMoves,
    isLoading,
    playerColor
}: Props) {
    const [show, setShow] = useState(false);
    
    // Animate in when suggestion arrives
    useEffect(() => {
        if (suggestedMove !== null && !isLoading) {
            setShow(true);
        }
    }, [suggestedMove, isLoading]);
    
    if (isLoading) {
        return (
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                    <Typography variant="body1">
                        🤖 AI analyzing your move...
                    </Typography>
                </Box>
            </Paper>
        );
    }
    
    if (!show || suggestedMove === null || lastMove === null) {
        return null;
    }
    
    const wasOptimal = lastMove === suggestedMove;
    const actualMoveConfidence = topMoves.find(m => m.move === lastMove)?.confidence || 0;
    const bestMoveConfidence = topMoves.find(m => m.move === suggestedMove)?.confidence || 0;
    
    const backgroundColor = wasOptimal
        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'  // Green gradient
        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';  // Pink/red gradient
    
    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                mb: 2,
                background: backgroundColor,
                color: 'white',
                borderRadius: 2,
                animation: 'slideIn 0.4s ease-out',
                '@keyframes slideIn': {
                    from: {
                        opacity: 0,
                        transform: 'translateY(-20px)'
                    },
                    to: {
                        opacity: 1,
                        transform: 'translateY(0)'
                    }
                }
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TipsAndUpdatesIcon />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    AI Move Analysis
                </Typography>
            </Box>
            
            {/* Your move */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Your move:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`Column ${lastMove}`}
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    />
                    {wasOptimal ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Optimal move!
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Confidence: {(actualMoveConfidence * 100).toFixed(1)}%
                        </Typography>
                    )}
                </Box>
            </Box>
            
            {/* AI suggestion (only show if different) */}
            {!wasOptimal && (
                <Box sx={{ mb: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        AI suggested:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={`Column ${suggestedMove}`}
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%, 100%': { transform: 'scale(1)' },
                                    '50%': { transform: 'scale(1.05)' }
                                }
                            }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {(bestMoveConfidence * 100).toFixed(1)}% confidence
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                        💡 The AI thinks column {suggestedMove} was the strongest move in this position
                    </Typography>
                </Box>
            )}
            
            {/* Top 3 alternatives */}
            {topMoves.length > 1 && (
                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Top {topMoves.length} moves:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {topMoves.map((move, idx) => (
                            <Chip
                                key={move.move}
                                label={`${idx + 1}. Col ${move.move} (${(move.confidence * 100).toFixed(1)}%)`}
                                size="small"
                                sx={{
                                    bgcolor: move.move === lastMove
                                        ? 'rgba(255, 255, 255, 0.4)'
                                        : 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontWeight: move.move === lastMove ? 'bold' : 'normal'
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
}
