import { renderRoutes, routes } from "./routes/routes";
import "@ant-design/v5-patch-for-react-19";

const App = () => {
  return renderRoutes(routes);
};

export default App;
