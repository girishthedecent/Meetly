import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from '../contexts/AuthContext.jsx';

export default function Authentication() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState();
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
        setMessage(result);
        setOpen(true);
        setUsername("");
        setPassword("");
      } else {
        let result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setName("");
        setUsername("");
        setPassword("");
        setFormState(0);
        setError("");
      }
    } catch (e) {
      let message = (e.response?.data?.message) || "Something went wrong";
      setError(message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(/galaxy-night-landscape.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "16px",
      }}
    >
      <CssBaseline />

      <Avatar style={{ margin: "8px", backgroundColor: "#0f33d5ff" }}>
        <LockOutlinedIcon />
      </Avatar>

      <Typography
        component="h1"
        variant="h4"
        style={{ color: "white", fontWeight: "bold" }}
      >
        {formState === 0 ? "Sign In" : "Sign Up"}
      </Typography>

      <div style={{ marginTop: "24px", width: "100%", maxWidth: "400px" }}>
        {formState === 1 && (
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputProps={{ style: { color: "white" } }}
            InputLabelProps={{ style: { color: "white" } }}
          />
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
        />

        {error && (
          <Typography style={{ color: "red", marginTop: "8px" }}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          style={{ marginTop: "24px", marginBottom: "16px" }}
          onClick={handleAuth}
        >
          {formState === 0 ? "Sign In" : "Sign Up"}
        </Button>

        <div
          style={{ display: "flex", justifyContent: "center", gap: "16px" }}
        >
          <Button
            onClick={() => setFormState(0)}
            variant={formState === 0 ? "outlined" : "text"}
            style={{ color: "white", borderColor: "white" }}
          >
            Sign In
          </Button>
          <Button
            onClick={() => setFormState(1)}
            variant={formState === 1 ? "outlined" : "text"}
            style={{ color: "white", borderColor: "white" }}
          >
            Sign Up
          </Button>
        </div>
      </div>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
