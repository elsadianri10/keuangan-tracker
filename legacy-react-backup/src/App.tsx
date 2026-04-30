// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Tagihan from "./pages/Menu/Tagihan";
import Wishlist from "./pages/Menu/Wishlist";
import HutangPiutang from "./pages/Menu/HutangPiutang";
import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/tagihan"
          element={
            <PrivateRoute>
              <Tagihan />
            </PrivateRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          }
        />
        <Route
          path="/hutangpiutang"
          element={
            <PrivateRoute>
              <HutangPiutang />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>

    // {/* Protected Home */}
    //     <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />

    //     {/* Protected Finance Routes - with Layout */}
    //     <Route
    //       path="/finance"
    //       element={
    //         <PrivateRoute>
    //           <FinanceLayout />
    //         </PrivateRoute>
    //       }
    //     >
    //       <Route path="tagihan" element={<Tagihan />} />
    //       <Route path="tabungan" element={<Tabungan />} />
    //       <Route path="pengeluaran" element={<PengeluaranBulanan />} />
    //     </Route>
    //   </Routes>
    // </Router>
  );
}

// export default App;