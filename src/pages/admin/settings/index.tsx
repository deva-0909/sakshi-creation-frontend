import React, { useState } from "react";
import { Box, Typography, Paper, Avatar, Divider } from "@mui/material";
import Button from "@/component/common_component/themebutton";
import { useAppSelector } from "@/store";
import PasswordUpdateDialog from "@/component/PasswordUpdateDialog";

// Full Figma slide scan Phase 9 (Theme 4, Slide 85): the staff sidebar's
// "Settings" item has no equivalent anywhere in the app -- only an
// Admin-only Setup section exists (`/admin/setup`, gated on the `setup`
// permission). This is a personal, self-service page any logged-in staff
// member can reach regardless of role/permissions (same exemption as
// Dashboard/My Orders in Dashboard/index.tsx's menu filter): read-only
// profile info plus a change-password action, reusing the existing
// PasswordUpdateDialog/updateStaffPasswordThunk (`/api/staff/updatepassword/:id`)
// that Setup > Staff already uses for an admin changing someone else's
// password -- here the staffId passed through is always the logged-in
// user's own id, so this is a self-service use of the same endpoint.
const SettingsPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Settings
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 520 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ width: 56, height: 56, fontSize: 20 }}>{initials}</Avatar>
          <Box>
            <Typography variant="h6">{fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role?.roleName}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box display="flex" flexDirection="column" gap={1} mb={3}>
          <Typography variant="body2" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1">{user?.email}</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Change the password used to sign in to your account.
          </Typography>
          <Button variant="contained" onClick={() => setPasswordDialogOpen(true)}>
            Change Password
          </Button>
        </Box>
      </Paper>

      {user && (
        <PasswordUpdateDialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          staffId={user.id}
          staffName={fullName}
        />
      )}
    </Box>
  );
};

export default SettingsPage;
