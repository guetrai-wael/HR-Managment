import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRoutes from "./routes/routes";
const GOOGLE_CLIENT_ID =
  "835344744313-8cplj8rt54a454unl95sqsaa5tgafc33.apps.googleusercontent.com";

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AppRoutes />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
