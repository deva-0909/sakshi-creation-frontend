import React from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import { MdPhone, MdEmail, MdAccessTime } from "react-icons/md";

// Full Figma slide scan Phase 9 (Theme 4, Slide 85): the staff sidebar's
// "Support" item has no equivalent anywhere in the app -- there's no
// support/ticketing concept anywhere in the codebase to hang it off of.
// Per the user's decision, this ships as a simple static contact page
// (placeholder details) rather than a full support-ticket system, exempted
// from the permission filter the same way Dashboard/My Orders/Settings are,
// so every logged-in staff member can reach it regardless of role.
const CONTACT_DETAILS = [
  { icon: <MdPhone size={20} />, label: "Phone", value: "+91 00000 00000" },
  { icon: <MdEmail size={20} />, label: "Email", value: "support@sakshicreation.example" },
  { icon: <MdAccessTime size={20} />, label: "Hours", value: "Mon-Sat, 10:00 AM - 7:00 PM" },
];

const SupportPage = () => {
  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={1}>
        Support
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Need help? Reach out using any of the options below.
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 520 }}>
        <Stack spacing={2.5}>
          {CONTACT_DETAILS.map((detail) => (
            <Box key={detail.label} display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "action.hover",
                }}
              >
                {detail.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {detail.label}
                </Typography>
                <Typography variant="body1">{detail.value}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SupportPage;
