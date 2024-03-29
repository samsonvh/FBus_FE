import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Table } from 'react-bootstrap';
import "../../style/Manager.css"
import defaultAvatar from '../../assets/img/driver.png'

import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardFooter,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";
import Header from "../../components/Headers/Header";
import {
  addDriverAPI,
  updateDriverAPI,
  getSingleDriver,
  getMultiDriversAPI,
  getAllDrivers,
  deleteDriverAPI,
  toggleStatusAPI,

} from "../../services/driver";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateDriver } from "../../redux/reducer";
import { isTokenExpired } from "../../services/checkToken";
import caution from '../../assets/img/caution.png'

const Drivers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [driverList, setDriverList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showToggleStatus, setShowToggleStatus] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [sortingOrder, setSortingOrder] = useState("oldest");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    fullName: "",
    gender: "",
    idCardNumber: "",
    address: "",
    phoneNumber: "",
    personalEmail: "",
    dateOfBirth: "",
    avatarFile: "",
  });

  // Check accessToken
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    getAllDrivers(user.accessToken)
      .then((res) => {
        if (res && res.data && res.data.data) {
          setDriverList(res.data.data);
        } else {
          alert("Error: Invalid response data");
          return;
        }
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  }, [navigate])

  // Fetch detail information and pass to detail form
  const fetchDriverDetails = async (id) => {
    await getSingleDriver(id)
      .then((res) => {
        setFormData(res.data)
      })
  };

  // Fetch list of driver and pass to table
  const fetchDrivers = async () => {
    if (currentSearchDriver !== "") {
      await getMultiDriversAPI({
        code: currentSearchDriver,
        email: currentSearchDriver,
        status: selectedStatus,
      }).then((res) => {
        // console.log(res.data.data)
        if (res.data.data != null) {
          dispatch(updateDriver(res.data.data))
        } else {
          dispatch(updateDriver([]))
        }
      })
    } else {
      await getMultiDriversAPI({ status: selectedStatus })
        .then((res) => {
          let sortedDrivers = res.data.data;
          if (sortingOrder === "newest") {
            sortedDrivers = res.data.data.sort((a, b) => b.id - a.id);
          } else if (sortingOrder === "oldest") {
            sortedDrivers = res.data.data.sort((a, b) => a.id - b.id);
          }

          setDriverList(sortedDrivers);
          dispatch(updateDriver(sortedDrivers));
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [sortingOrder, selectedStatus]);

  const handleSortingChange = (order) => {
    setSortingOrder(order);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Call show detail form
  const handleShowDetails = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    await fetchDriverDetails(id);
    setShowDetails(true); // Show the modal

  }

  // --UPDATE FUNCTIONS
  const handleUpdateClose = () => {
    setShowUpdate(false);
  }

  const handleUpdateShow = async (driver) => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    await fetchDriverDetails(driver.id); // fetch old data       
    setShowUpdate(true); // show update modal
    setIsUpdated(false);
    setErrors({});
  };

  const updateDriverData = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    // Check if form data has been changed
    if (!isUpdated) {
      toast.info("Nothing has been changed!", {
        autoClose: 1000,
      });
      setShowUpdate(true);
      return;
    }
    if (formData.personalEmail === null) {
      formData.personalEmail = "";
    }
    updateDriverAPI(formData, formData.id)
      .then((res) => {
        // console.log(res);
        if (res.status === 200) {
          toast.success("Driver update successfully!", {
            autoClose: 1000,
          });
        }
        setShowUpdate(false);
        fetchDrivers();
      })
      .catch((e) => {
        if (e.response.data.errors) {
          setErrors(e.response.data.errors);
        }
        toast.error("Failed to update the driver!", {
          autoClose: 1000,
        });
        setShowUpdate(true);
      })
  }
  // END UPDATE FUNCTIONS

  // TOGGLE STATUS FUNCTION
  const [oldStatus, setOldStatus] = useState("");
  const [toggleDriverId, setToggleDriverId] = useState(null);
  const handleToggleStatus = (driver) => {
    setOldStatus(driver.status)
    setToggleDriverId(driver.id)
    setShowToggleStatus(true);
  }

  const toggleStatus = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    let status = "INACTIVE";
    if (oldStatus === "INACTIVE") {
      status = "ACTIVE"
    }
    toggleStatusAPI(toggleDriverId, status)
      .then((res) => {
        // console.log(res)
        toast.success("Successull to enable/disable status!", {
          autoClose: 1000,
        });
        setShowToggleStatus(false);
        fetchDrivers()
      })
      .catch(() => {
        toast.error("Failed to enable/disable status!", {
          autoClose: 1000,
        });
        setShowToggleStatus(false);
      });
  }
  // END TOGGLE STATUS

  // DELETE FUNCTIONS
  const [deleteDriverId, setDeleteDriverId] = useState();
  const handleDeleteDriver = (id) => {
    setDeleteDriverId(id)
    setShowDelete(true)
  };

  const deleteDriver = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    deleteDriverAPI(deleteDriverId)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Driver deleted successfully!", {
            autoClose: 1000,
          });
        }
        setShowDelete(false);
        fetchDrivers();
      })
      .catch(() => {
        toast.error("Failed to delete the driver!", {
          autoClose: 1000,
        });
      });
  }
  // END DELETE FUNCTIONS

  // ADD
  const handleAddDriver = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    const newErrors = {};
    if (user == null || !user || isTokenExpired()) {
      setShowBackdrop(true)
      return;
    }
    if (!formData.fullName) {
      newErrors.FullName = ['Please enter the Full Name'];
    }
    if (!formData.gender) {
      newErrors.Gender = ['Please choose the Gender'];
    }
    if (!formData.idCardNumber) {
      newErrors.IdCardNumber = ['Please enter the Id Card Number'];
    }

    if (!formData.phoneNumber) {
      newErrors.PhoneNumber = ['Please enter the Phone Number'];
    }

    if (!formData.dateOfBirth) {
      newErrors.DateOfBirth = ['Please choose the Date Of Birth'];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    addDriverAPI(formData)
      .then((res) => {
        // console.log(res);
        if (res.status === 200) {
          toast.success("Driver has been add successfully!", {
            autoClose: 1000,
          });
          fetchDrivers()
          setShowAdd(false);
        }
      })
      .catch((e) => {
        if (e.response.data.errors) {
          setErrors(e.response.data.errors);
        }
        setShowAdd(true);
      });
  };
  const handleAddClose = () => {
    setShowAdd(false);
  }
  const handleAddOpen = () => {
    setFormData({
      email: "",
      code: "",
      fullName: "",
      gender: "",
      idCardNumber: "",
      address: "",
      phoneNumber: "",
      personalEmail: "",
      dateOfBirth: "",
      avatarFile: "",
    });
    setErrors({});
    setShowAdd(true);
  };
  // END ADD

  // PAGING
  const itemsPerPage = 5;
  const [currentDriverList, setCurrentDriverList] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setTotalPages(Math.ceil(driverList.length / itemsPerPage));
    setStartIndex((currentPage - 1) * itemsPerPage);
  }, [driverList, currentPage]);

  useEffect(() => {
    setEndIndex(startIndex + itemsPerPage);
    setCurrentDriverList(driverList.slice(startIndex, endIndex));
  }, [driverList, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [driverList.length]);

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  // END PAGING

  // EXPIRED
  const handleLogoutClose = () => {
    navigate("/auth/login");
    localStorage.removeItem('user');
    toast.success("Logout successful", {
      autoClose: 1000,
    });
    setShowBackdrop(false);
  }

  // REDUX
  const drivers = useSelector((state) => state.drivers.value);
  const currentSearchDriver = useSelector((state) => state.drivers.currentSearchDriver);
  React.useEffect(() => {
    setDriverList(drivers)
  }, [drivers])
  // END REDUX
  const combineDate = (day, month, year) => {
    const formattedDay = day ? String(day).padStart(2, "0") : "01";
    const formattedMonth = month ? String(month).padStart(2, "0") : "01";
    const formattedYear = year ? String(year) : "YYYY";
    return `${formattedYear}-${formattedMonth}-${formattedDay}`;
  };

  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - 18 - i);
  return (
    <>
      <Header />
      <ToastContainer />
      <Container className="mt--7" fluid>
        <Row>
          <div className="col">
            <Card className=" card-container shadow">
              <CardHeader className="bg-transparent">
                <h3 className="mb-0">Manager Drivers</h3>
              </CardHeader>
              <CardBody>

                <Modal
                  show={showBackdrop}
                  onHide={() => setShowBackdrop(false)}
                  animation={true}
                  dialogClassName="modal-logout"
                  backdrop="static"
                >
                  <Modal.Body className="modal-logout-body">
                    <h2>YOUR LOGIN TIMEOUT HAS EXPIRED,<br />PLEASE LOGIN AGAIN TO CONTINUE!</h2>
                    <img className="img" src={caution} alt="" />

                    <Button className="button" color="primary" onClick={handleLogoutClose}>
                      OK
                    </Button>
                  </Modal.Body>
                </Modal>

                <Modal show={showToggleStatus} onHide={() => setShowToggleStatus(false)} animation={true}>
                  <Modal.Header >
                    <Modal.Title>Enable/Disable driver</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>Are you sure to enable/disable this driver?</Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowToggleStatus(false)}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={toggleStatus}>
                      Enable/Disable
                    </Button>
                  </Modal.Footer>
                </Modal>

                <Modal show={showDelete} onHide={() => setShowDelete(false)} animation={true}>
                  <Modal.Header >
                    <Modal.Title>Delete driver</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>Are you sure to delete this driver?</Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDelete(false)}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={() => deleteDriver()}>
                      Delete
                    </Button>
                  </Modal.Footer>
                </Modal>

                {/* Add model */}
                <Modal show={showAdd} onHide={handleAddClose}>
                  <Modal.Body>
                    <Form>
                      <p>Cases (*) are required</p>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Full Name*
                          </Form.Label>
                          <input
                            className="input-form"
                            type="text"
                            name="fullName"
                            placeholder="Nguyen Van A"
                            autoFocus
                            required
                            maxLength={50}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                fullName: e.target.value
                              })
                              setErrors({
                                ...errors,
                                FullName: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.FullName && (
                          <span className="error-msg">{errors.FullName}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Gender*
                          </Form.Label>
                          <select
                            className="input-form"
                            name="gender"
                            autoFocus
                            required
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                gender: e.target.value
                              });
                              setErrors({
                                ...errors,
                                Gender: null
                              });
                            }}
                          >
                            <option value="">Select gender</option>
                            <option value="true">Male</option>
                            <option value="false">Female</option>
                          </select>
                        </div>
                        {errors && errors.Gender && (
                          <span className="error-msg">{errors.Gender}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Id Card Number*
                          </Form.Label>
                          <input
                            className="input-form"
                            type="text"
                            name="idCardNumber"
                            placeholder="1234567890"
                            autoFocus
                            required
                            minLength={5}
                            maxLength={12}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                idCardNumber: e.target.value
                              })
                              setErrors({
                                ...errors,
                                IdCardNumber: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.IdCardNumber && (
                          <span className="error-msg">{errors.IdCardNumber}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Address*
                          </Form.Label>
                          <input
                            className="input-form"
                            type="text"
                            name="address"
                            placeholder="Address Number"
                            autoFocus
                            required
                            maxLength={100}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                address: e.target.value
                              })
                              setErrors({
                                ...errors,
                                Address: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.Address && (
                          <span className="error-msg">{errors.Address}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Phone Number*
                          </Form.Label>
                          <input
                            className="input-form"
                            type="text"
                            name="phoneNumber"
                            placeholder="+84 987654321"
                            autoFocus
                            required
                            maxLength={13}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                phoneNumber: e.target.value
                              })
                              setErrors({
                                ...errors,
                                PhoneNumber: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.PhoneNumber && (
                          <span className="error-msg">{errors.PhoneNumber}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Date of Birth*
                          </Form.Label>
                          <div className="date-input-container">
                            <select
                              className="input-form date-input"
                              name="day"
                              value={formData.day || ''}
                              onChange={(e) => {
                                const day = e.target.value;
                                setFormData((prevFormData) => ({
                                  ...prevFormData,
                                  day,
                                  dateOfBirth: combineDate(day, prevFormData.month, prevFormData.year)
                                }));
                              }}
                            >
                              <option value="">DD</option>
                              {days.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                            <span className="date-separator">/</span>
                            <select
                              className="input-form date-input"
                              name="month"
                              value={formData.month || ''}
                              onChange={(e) => {
                                const month = e.target.value;
                                setFormData((prevFormData) => ({
                                  ...prevFormData,
                                  month,
                                  dateOfBirth: combineDate(prevFormData.day, month, prevFormData.year)
                                }));
                              }}
                            >
                              <option value="">MM</option>
                              {months.map((month) => (
                                <option key={month} value={month}>
                                  {month}
                                </option>
                              ))}
                            </select>
                            <span className="date-separator">/</span>
                            <select
                              className="input-form date-input"
                              name="year"
                              value={formData.year || ''}
                              onChange={(e) => {
                                const year = e.target.value;
                                setFormData((prevFormData) => ({
                                  ...prevFormData,
                                  year,
                                  dateOfBirth: combineDate(prevFormData.day, prevFormData.month, year)
                                }));
                              }}
                            >
                              <option value="">YYYY</option>
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {errors && errors.DateOfBirth && (
                          <span className="error-msg">{errors.DateOfBirth}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Email
                          </Form.Label>
                          <input
                            className="input-form"
                            type="email"
                            name="email"
                            placeholder="fbus@gmail.com"
                            maxLength={40}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                email: e.target.value
                              })
                              setErrors({
                                ...errors,
                                Email: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.Email && (
                          <span className="error-msg">{errors.Email}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Personal Email
                          </Form.Label>
                          <input
                            className="input-form"
                            type="email"
                            name="personalEmail"
                            placeholder="personalEmail@gmail.com"
                            maxLength={40}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                personalEmail: e.target.value
                              })
                              setErrors({
                                ...errors,
                                PersonalEmail: null
                              });
                            }}
                          />
                        </div>
                        {errors && errors.PersonalEmail && (
                          <span className="error-msg">{errors.PersonalEmail}</span>
                        )}
                      </Row>
                      <Row className="container_input">
                        <div className="flex input-group">
                          <Form.Label className="align-items-center">
                            Avatar File
                          </Form.Label>
                          <input
                            className="input-form"
                            type="file"
                            name="avatarFile"
                            accept=".jpeg, .png, .svg, .jpg"
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                avatarFile: e.target.files[0]
                              });
                            }}
                          />
                        </div>
                      </Row>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleAddClose}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={handleAddDriver}>
                      Add +
                    </Button>
                  </Modal.Footer>
                </Modal>

                {/* Detail model */}
                <Modal show={showDetails} onHide={() => setShowDetails(false)}>
                  <Modal.Header >
                    <Modal.Title>Driver detail</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="text"
                          name="email"
                          placeholder="No email available"
                          autoFocus
                          readOnly
                          value={formData.email || ""}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="code">
                        <Form.Label>Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="code"
                          placeholder="Code"
                          autoFocus
                          readOnly
                          value={formData.code}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="fullName"
                          placeholder="fullName"
                          autoFocus
                          readOnly
                          value={formData.fullName}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="gender">
                        <Form.Label>Gender</Form.Label>
                        <Form.Control
                          type="text"
                          name="gender"
                          placeholder="Gender"
                          autoFocus
                          readOnly
                          value={formData.gender}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="idCardNumber">
                        <Form.Label>Id Card Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="idCardNumber"
                          placeholder="Id Card Number"
                          autoFocus
                          readOnly
                          value={formData.idCardNumber}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          placeholder="Address"
                          autoFocus
                          readOnly
                          value={formData.address}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="phoneNumber">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phoneNumber"
                          placeholder="Phone Number"
                          autoFocus
                          readOnly
                          value={formData.phoneNumber}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="personalEmail">
                        <Form.Label>Personal Email</Form.Label>
                        <Form.Control
                          type="text"
                          name="personalEmail"
                          placeholder="No personal email available"
                          autoFocus
                          readOnly
                          value={formData.personalEmail || ""}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="dateOfBirth">
                        <Form.Label>Date of Birth (MM-DD-YYYY)</Form.Label>
                        <Form.Control
                          type="text"
                          name="dateOfBirth"
                          placeholder="Date of Birth"
                          readOnly
                          value={new Date(formData.dateOfBirth.slice(0, 10)).toLocaleDateString("en-US")}
                        />
                      </Form.Group>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>
                {/* Update model */}
                <Modal show={showUpdate} onHide={handleUpdateClose}>
                  <Modal.Header >
                    <Modal.Title>Update driver</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="text"
                          name="email"
                          placeholder="No email available"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              email: e.target.value
                            })
                            setIsUpdated(true);
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>Full Name</Form.Label>
                        {errors && errors.FullName && (
                          <span style={{ color: "red", float: "right" }}>*{errors.FullName}</span>
                        )}
                        <Form.Control
                          type="text"
                          name="fullName"
                          placeholder="Full Name"
                          autoFocus
                          required
                          value={formData.fullName}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              fullName: e.target.value
                            })
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              FullName: null
                            });
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="gender">
                        <Form.Label>Gender</Form.Label>
                        {errors && errors.Gender && (
                          <span style={{ color: "red", float: "right" }}>*{errors.Gender}</span>
                        )}
                        <Form.Control
                          as="select"
                          name="gender"
                          placeholder="Gender"
                          autoFocus
                          required
                          value={formData.gender}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              gender: e.target.value
                            });
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              Gender: null
                            });
                          }}
                        >
                          {formData.gender === "Female" ? (
                            <>
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                            </>
                          ) : (
                            <>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </>
                          )}
                        </Form.Control>
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="idCardNumber">
                        <Form.Label>Id Card Number</Form.Label>
                        {errors && errors.IdCardNumber && (
                          <span style={{ color: "red", float: "right" }}>*{errors.IdCardNumber}</span>
                        )}
                        <Form.Control
                          type="text"
                          name="idCardNumber"
                          placeholder="Id Card Number"
                          autoFocus
                          required
                          value={formData.idCardNumber}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              idCardNumber: e.target.value
                            })
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              IdCardNumber: null
                            });
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="address">
                        <Form.Label>Address</Form.Label>
                        {errors && errors.Address && (
                          <span style={{ color: "red", float: "right" }}>*{errors.Address}</span>
                        )}
                        <Form.Control
                          type="text"
                          name="address"
                          placeholder="Address"
                          autoFocus
                          required
                          value={formData.address}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              address: e.target.value
                            })
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              Address: null
                            });
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="phoneNumber">
                        <Form.Label>Phone Number</Form.Label>
                        {errors && errors.PhoneNumber && (
                          <span style={{ color: "red", float: "right" }}>*{errors.PhoneNumber}</span>
                        )}
                        <Form.Control
                          type="text"
                          name="phoneNumber"
                          placeholder="Phone Number"
                          autoFocus
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value
                            })
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              PhoneNumber: null
                            });
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="personalEmail">
                        <Form.Label>Personal Email</Form.Label>
                        <Form.Control
                          type="text"
                          name="personalEmail"
                          placeholder="No personal email available"
                          value={formData.personalEmail || ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              personalEmail: e.target.value
                            })
                            setIsUpdated(true);
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="dateOfBirth">
                        <Form.Label>Date of Birth (MM-DD-YYYY)</Form.Label>
                        {errors && errors.DateOfBirth && (
                          <span style={{ color: "red", float: "right" }}>*{errors.DateOfBirth}</span>
                        )}
                        <Form.Control
                          type="date"
                          name="dateOfBirth"
                          required
                          value={formData.dateOfBirth ? formData.dateOfBirth.slice(0, 10) : ''}
                          onChange={(e) => {
                            const inputDate = e.target.value;
                            const formattedDate = inputDate
                              .split("-")
                              .map((part) => part.padStart(2, "0"))
                              .join("-");

                            setFormData({
                              ...formData,
                              dateOfBirth: formattedDate
                            })
                            setIsUpdated(true);
                            setErrors({
                              ...errors,
                              DateOfBirth: null
                            });
                          }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="avatarFile">
                        <Form.Label>Avatar File</Form.Label>
                        <Form.Control
                          type="file"
                          name="avatarFile"
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              avatarFile: e.target.files[0] // Store the selected file in the form data
                            });
                            setIsUpdated(true);
                          }}
                        />
                      </Form.Group>

                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleUpdateClose}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={updateDriverData}>
                      Confirm
                    </Button>
                  </Modal.Footer>
                </Modal>

                {/* Table list */}
                <div className="list">
                  <div style={{ display: "flex" }}>
                    <div style={{ flexGrow: "8" }}></div>
                    <div style={{ paddingTop: "20px", paddingLeft: "20px" }}>
                      Filter by Status:
                      <select
                        as="select"
                        value={selectedStatus}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        style={{ height: "22px", borderRadius: "5px", marginLeft: "10px", fontSize: "0.9rem" }}
                      >
                        <option value="">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="DELETED">Deleted</option>
                      </select>
                    </div>
                    <div style={{ paddingTop: "20px", paddingLeft: "20px" }}>
                      Sort:
                      <select
                        as="select"
                        value={sortingOrder}
                        onChange={(e) => handleSortingChange(e.target.value)}
                        style={{ height: "22px", borderRadius: "5px", marginLeft: "10px", fontSize: "0.9rem" }}
                      >
                        <option value="oldest">Oldest Drivers</option>
                        <option value="newest">Newest Drivers</option>
                      </select>
                    </div>
                    <Button variant="primary" onClick={handleAddOpen} size="md" className="add_button">Add Driver +</Button>
                  </div>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Id</th>
                        <th>Avatar </th>
                        <th>Code</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Status</th>
                        <th>More Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDriverList.map((driver, index) => (
                        <tr key={index}>
                          <td>
                            <span>{driver.id ? driver.id : "none"}</span>
                          </td>
                          <td>
                            {driver.avatar ? (
                              <img className="driver-img" src={driver.avatar} alt="" />
                            ) : (
                              <img className="driver-img" src={defaultAvatar} alt="" />
                            )}
                          </td>
                          <td>
                            <span className="link-style" onClick={(e) => {
                              e.preventDefault()
                              handleShowDetails(driver.id)
                            }}>{driver.code ? driver.code : "none"}</span>

                          </td>
                          <td>
                            <span className="link-style" onClick={(e) => {
                              e.preventDefault()
                              handleShowDetails(driver.id)
                            }}>{driver.email ? driver.email : "none"}</span>
                          </td>
                          <td>
                            <span className="link-style" onClick={(e) => {
                              e.preventDefault()
                              handleShowDetails(driver.id)
                            }}>{driver.fullName ? driver.fullName : "none"}</span>
                          </td>
                          <td>
                            <span className={`status ${driver.status === 'ACTIVE' ? 'active' : driver.status === 'INACTIVE' ? 'inactive' : ''}`}>
                              {driver.status}
                            </span>
                          </td>
                          <td className={`registration ${driver.status === "DELETED" ? "disable-actions" : ""}`}>
                            <UncontrolledDropdown>
                              <DropdownToggle
                                className="btn-icon-only text-light"
                                role="button"
                                size="sm"
                                color=""
                              >
                                <i className="fas fa-ellipsis-v" />
                              </DropdownToggle>
                              <DropdownMenu className="dropdown-menu-arrow" >
                                <DropdownItem
                                  className="update-dropdown-item"
                                  onClick={() => handleUpdateShow(driver)}
                                >
                                  Update
                                </DropdownItem>
                                <DropdownItem
                                  className="disable-enable-dropdown-item"
                                  onClick={() => {
                                    handleToggleStatus(driver)
                                  }}
                                >
                                  Enable/Disable
                                </DropdownItem>
                                <DropdownItem
                                  className="delete-dropdown-item"
                                  onClick={() => handleDeleteDriver(driver.id)}
                                >
                                  Delete
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
              <CardFooter className="py-4">
                <nav aria-label="...">
                  <Pagination
                    className="pagination justify-content-end mb-0"
                    listClassName="justify-content-end mb-0"
                  >
                    <PaginationItem disabled={currentPage === 1}>
                      <PaginationLink
                        href=""
                        onClick={() => handlePageClick(currentPage - 1)}
                        tabIndex="-1"
                      >
                        <i className="fas fa-angle-left" />
                        <span className="sr-only">Previous</span>
                      </PaginationLink>
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <PaginationItem
                        key={index + 1}
                        active={currentPage === index + 1}
                      >
                        <PaginationLink
                          href=""
                          onClick={() => handlePageClick(index + 1)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem disabled={currentPage === totalPages}>
                      <PaginationLink
                        href=""
                        onClick={() => handlePageClick(currentPage + 1)}
                      >
                        <i className="fas fa-angle-right" />
                        <span className="sr-only">Next</span>
                      </PaginationLink>
                    </PaginationItem>
                  </Pagination>
                </nav>
              </CardFooter>
            </Card>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default Drivers;