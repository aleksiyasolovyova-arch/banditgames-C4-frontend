import { Box, Typography, Paper, CircularProgress, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import InsightsIcon from "@mui/icons-material/Insights";

interface WinProbabilities {
  win: number;
  draw: number;
  loss: number;
}

interface Props {
  probabilities: WinProbabilities | null;
  isLoading: boolean;
  moveIndex: number | null;
}

export default function WinProbabilityDisplay({
  probabilities,
  isLoading,
  moveIndex
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (probabilities && !isLoading) {
      setShow(true);
    }
  }, [probabilities, isLoading]);

  if (isLoading) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          background: "linear-gradient(135deg, #1d2671 0%, #c33764 100%)",
          color: "white",
          borderRadius: 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} sx={{ color: "white" }} />
          <Typography variant="body1">
            🤖 AI estimating game outcome...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!show || !probabilities || moveIndex === null) {
    return null;
  }

  const { win, draw, loss } = probabilities;

  const bestOutcome =
    win >= draw && win >= loss
      ? "Win"
      : draw >= win && draw >= loss
      ? "Draw"
      : "Loss";

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        background: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
        color: "white",
        borderRadius: 2,
        animation: "slideIn 0.4s ease-out",
        "@keyframes slideIn": {
          from: { opacity: 0, transform: "translateY(-20px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <InsightsIcon />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          AI Outcome Prediction
        </Typography>
      </Box>

      {/* Move analyzed */}
      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
        After playing:
      </Typography>

      <Chip
        label={`Column ${moveIndex}`}
        sx={{
          mb: 2,
          bgcolor: "rgba(255,255,255,0.3)",
          color: "white",
          fontWeight: "bold",
          fontSize: "1rem"
        }}
      />

      {/* Probabilities */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Chip
          label={`Win ${(win * 100).toFixed(1)}%`}
          sx={{ bgcolor: "rgba(56, 239, 125, 0.8)", color: "#0b3d2e" }}
        />
        <Chip
          label={`Draw ${(draw * 100).toFixed(1)}%`}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.7)", color: "#333" }}
        />
        <Chip
          label={`Loss ${(loss * 100).toFixed(1)}%`}
          sx={{ bgcolor: "rgba(245, 87, 108, 0.8)", color: "#3d0b15" }}
        />
      </Box>

      {/* Conclusion */}
      <Typography
        variant="caption"
        sx={{ display: "block", mt: 2, opacity: 0.85 }}
      >
        💡 Most likely outcome: <strong>{bestOutcome}</strong>
      </Typography>
    </Paper>
  );
}
