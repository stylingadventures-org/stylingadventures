// site/src/App.jsx (fragment)
import { Routes, Route } from "react-router-dom";
import BestieLayout from "./routes/bestie/Layout";
import BestieOverview from "./routes/bestie/Overview";
import BestiePerks from "./routes/bestie/Perks";
import BestieContent from "./routes/bestie/Content";
import FanHome from "./routes/fan/FanHome";

<Routes>
  {/* global pages... */}
  <Route path="/fan" element={<FanHome />} />

  <Route path="/bestie" element={<BestieLayout />}>
    <Route index element={<BestieOverview />} />
    <Route path="perks" element={<BestiePerks />} />
    <Route path="content" element={<BestieContent />} />
  </Route>
</Routes>
