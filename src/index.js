import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/scss/argon-dashboard-react.scss";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from "./layouts/Admin";
import AuthLayout from "./layouts/Auth";
import { Provider } from "react-redux";
import { store } from "./redux/state";
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <Routes>        
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/auth/*" element={<AuthLayout />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Provider>
    <ToastContainer />
  </BrowserRouter>

);
