import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import FormWrapper from "./FormWrapper";
import RegisterUser from "./RegisterUser";

const Teams = () => {
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      const res = await fetchAllUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setErrorMsg("Could not load users. Check API URL & auth token.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (dto) => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await createUser(dto);
      if (res.status === 201) {
        setShowCreate(false);
        await loadUsers();
      } else {
        setErrorMsg("Create failed. Unexpected server response.");
      }
    } catch (err) {
      console.error("Create failed:", err.response?.data || err);
      setErrorMsg("Create failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (dto) => {
    if (!editingUser) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await updateUser(editingUser.id, dto);
      if (res.status === 200 || res.status === 204) {
        setShowEdit(false);
        setEditingUser(null);
        await loadUsers();
      } else {
        setErrorMsg("Update failed. Unexpected server response.");
      }
    } catch (err) {
      console.error("Update failed:", err.response?.data || err);
      setErrorMsg("Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMsg("Delete failed.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={false} onClose={() => {}} />
      <main className="dashboard-main">
        <Header title="Teams" subtitle="Manage and organize your Users" onToggleSidebar={() => {}} />

        <div className="dashboard-content">
          <div className="row">
            <div className="col-md-8 mx-auto">
              {errorMsg && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                  <div>{errorMsg}</div>
                  <button type="button" className="btn-close" onClick={() => setErrorMsg("")} />
                </div>
              )}

              {/* Top bar */}
              <div className="card shadow-sm">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Users</h5>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      setShowCreate(true);
                      setEditingUser(null);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1" />
                    New User
                  </button>
                </div>
              </div>

              {/* Users list */}
              <div className="card shadow-sm mt-3">
                <div className="card-body">
                  {loadingList ? (
                    <div className="text-muted">Loading users…</div>
                  ) : users.length === 0 ? (
                    <div className="text-muted">No users found</div>
                  ) : (
                    <div className="list-group">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div className="me-3">
                            <div className="fw-semibold">{u.name || u.username}</div>
                            <div className="small text-muted">{u.email}</div>
                            <div className="small text-muted">Role: {u.role}</div>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success"
                              onClick={() => {
                                setEditingUser(u);
                                setShowEdit(true);
                              }}
                            >
                              <i className="bi bi-pencil me-1" />
                              Edit
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDelete(u.id)}>
                              <i className="bi bi-trash me-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Create modal */}
              <FormWrapper
                title="Register New User"
                show={showCreate}
                onClose={() => setShowCreate(false)}
                maxWidth="520px"
              >
                <RegisterUser onSubmit={handleCreate} submitting={submitting} />
              </FormWrapper>

              {/* Edit modal */}
              <FormWrapper
                title="Edit User"
                show={showEdit}
                onClose={() => {
                  setShowEdit(false);
                  setEditingUser(null);
                }}
                maxWidth="520px"
              >
                <RegisterUser
                  initialData={editingUser}
                  onSubmit={handleUpdate}
                  submitting={submitting}
                />
              </FormWrapper>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Teams;
