"use client"

import React, { useEffect, useState } from "react"
import { Box, IconButton, Badge, Menu, Typography, Divider, CircularProgress, Tooltip } from "@mui/material"
import { MdNotifications, MdDoneAll } from "react-icons/md"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getMyNotificationsThunk, getUnreadCountThunk, markAsReadThunk, markAllAsReadThunk } from "@/store/slices/notificationSlice"

// Polls rather than opening a live connection -- there's no websocket/SSE
// infrastructure in this app, and a 60s poll is a reasonable default for
// an internal ERP tool where "a minute stale" is not a real problem.
const POLL_INTERVAL_MS = 60000

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const NotificationBell: React.FC = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { notifications, unreadCount, loading } = useAppSelector((state) => state.notifications)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  useEffect(() => {
    dispatch(getUnreadCountThunk())
    const interval = setInterval(() => dispatch(getUnreadCountThunk()), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [dispatch])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    dispatch(getMyNotificationsThunk({ limit: 10 }))
  }

  const handleClose = () => setAnchorEl(null)

  const handleNotificationClick = (id: string, link?: string, isRead?: boolean) => {
    if (!isRead) dispatch(markAsReadThunk(id))
    handleClose()
    if (link) router.push(link)
  }

  const handleMarkAllAsRead = (event: React.MouseEvent) => {
    event.stopPropagation()
    dispatch(markAllAsReadThunk())
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} size="small">
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <MdNotifications size={22} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { width: 360, maxHeight: 440 } }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Typography fontWeight={600} fontSize={14}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <MdDoneAll size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Divider />
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={22} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography fontSize={13} color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <Box
              key={n._id}
              onClick={() => handleNotificationClick(n._id, n.link, n.isRead)}
              sx={{
                px: 2,
                py: 1.25,
                cursor: "pointer",
                borderBottom: "1px solid #F2F4F7",
                bgcolor: n.isRead ? "transparent" : "#F9F5FF",
                "&:hover": { bgcolor: "#F2F4F7" },
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1}>
                {!n.isRead && (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#7F56D9", mt: 0.6, flexShrink: 0 }} />
                )}
                <Box flex={1} minWidth={0}>
                  <Typography fontSize={13} fontWeight={n.isRead ? 400 : 600} noWrap>
                    {n.title}
                  </Typography>
                  {n.message && (
                    <Typography fontSize={12} color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {n.message}
                    </Typography>
                  )}
                  <Typography fontSize={11} color="text.secondary" mt={0.25}>
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Menu>
    </>
  )
}

export default NotificationBell
