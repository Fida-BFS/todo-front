import React, { useMemo, useState } from "react";

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{4,50}$/;

const RegisterUser = ({ initialData = null, onSubmit, submitting }) => {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    username: initialData?.username || "",
    role: initialData?.role || "USER",
    password: "",
    confirmPassword: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const validate = useMemo(
    () => (values) => {
      const errors = {};
      if (!values.name || values.name.trim().length < 2 || values.name.trim().length > 100) {
        errors.name = "Name must be between 2 and 100 characters.";
      }
      if (!values.email) {
        errors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = "Invalid email format.";
      }
      if (!values.username || values.username.length < 4 || values.username.length > 50) {
        errors.username = "Username must be between 4 and 50 characters.";
      } else if (!USERNAME_REGEX.test(values.username)) {
        errors.username = "Only letters, numbers, dots, underscores and hyphens are allowed.";
      }

      if (!isEdit) {
        if (!values.password || values.password.length < 8 || values.password.length > 100) {
          errors.password = "Password must be between 8 and 100 characters.";
        }
        if (!values.confirmPassword) {
          errors.confirmPassword = "Please confirm the password.";
        } else if (values.password !== values.confirmPassword) {
          errors.confirmPassword = "Passwords do not match.";
        }
      }
      return errors;
    },
    [isEdit]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    setLocalErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: form.name,
      email: form.email,
      username: form.username,
      role: form.role,
    };

    if (!isEdit) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div className="mb-3">
        <label className="form-label">Name</label>
        <input
          type="text"
          className={`form-control ${localErrors.name ? "is-invalid" : ""}`}
          name="name"
          value={form.name}
          onChange={handleChange}
        />
        {localErrors.name && <div className="invalid-feedback">{localErrors.name}</div>}
      </div>

      {/* Email */}
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          type="email"
          className={`form-control ${localErrors.email ? "is-invalid" : ""}`}
          name="email"
          value={form.email}
          onChange={handleChange}
        />
        {localErrors.email && <div className="invalid-feedback">{localErrors.email}</div>}
      </div>

      {/* Username */}
      <div className="mb-3">
        <label className="form-label">Username</label>
        <input
          type="text"
          className={`form-control ${localErrors.username ? "is-invalid" : ""}`}
          name="username"
          value={form.username}
          onChange={handleChange}
        />
        {localErrors.username && <div className="invalid-feedback">{localErrors.username}</div>}
      </div>

      {/* Role */}
      <div className="mb-3">
        <label className="form-label">Role</label>
        <select
          className="form-select"
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Password fields only for create */}
      {!isEdit && (
        <>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPwd ? "text" : "password"}
                className={`form-control ${localErrors.password ? "is-invalid" : ""}`}
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPwd((s) => !s)}
              >
                <i className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
            {localErrors.password && <div className="invalid-feedback d-block">{localErrors.password}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <div className="input-group">
              <input
                type={showConfirm ? "text" : "password"}
                className={`form-control ${localErrors.confirmPassword ? "is-invalid" : ""}`}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirm((s) => !s)}
              >
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
            {localErrors.confirmPassword && (
              <div className="invalid-feedback d-block">{localErrors.confirmPassword}</div>
            )}
          </div>
        </>
      )}

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-success" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default RegisterUser;
