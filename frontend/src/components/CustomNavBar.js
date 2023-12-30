import React, {useContext} from 'react';
import { Navbar, Nav, Dropdown } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import AppContext from '../AppContext';

const CustomNavbar = () => {
  const { username, handleLogout, project, projects, handleUpdateProject } = useContext(AppContext);

  const handleSelectProject = (project) => {
    handleUpdateProject(project);
    window.location.href = `/project_info`;
  }

  return (
    <Navbar bg="dark" variant="dark" className="justify-content-between">
      <Nav>
        <Dropdown>
          <Dropdown.Toggle id="user-dropdown" variant="dark">
            {
              Object.keys(project).length ? project['pro_name'] : 'Select a project'
            }
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {
              projects.filter(item => item['mem_status'] != 'waiting').map(item => 
                <Dropdown.Item key={item['pro_id']} onClick={() => handleSelectProject(item)}>{item['pro_name']}</Dropdown.Item>)
            }            
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
      {/* {
        Object.keys(project).length ? <Nav className="ml-auto">
          <a
            href="/project_info"
            className={`nav-link ${window.location.pathname === "/project_info" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            General information
          </a>
        </Nav> : <></>
      } */}
      {
        Object.keys(project).length && project['pro_status'] == true ? 
        <Nav className="ml-auto">
          <a
            href="/initiation"
            className={`nav-link ${window.location.pathname === "/initiation" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            1. Initiation
          </a>
          <a
            href="/references"
            className={`nav-link ${window.location.pathname === "/references" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            2. References
          </a>
          <a
            href="/practical-screen"
            className={`nav-link ${window.location.pathname === "/practical-screen" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            3. Pratical Screening
          </a>
          <a
            href="/fulltext-screen"
            className={`nav-link ${window.location.pathname === "/fulltext-screen" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            4. Full-text Screening
          </a>
          <a
            href="/data-extraction"
            className={`nav-link ${window.location.pathname === "/data-extraction" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            5. Data extraction
          </a>
          <a
            href="/synthesis"
            className={`nav-link ${window.location.pathname === "/synthesis" ? "active" : ""}`}
            style={{
              fontWeight: "bold",
              // Add other styles as needed
            }}
          >
            6. Synthesis
          </a>
        </Nav> : <></>
      }
      <Nav>
        <Dropdown>
          <Dropdown.Toggle id="user-dropdown" variant="dark">
            👤 {username}
          </Dropdown.Toggle>
          <Dropdown.Menu>            
            <Dropdown.Item href="/">Homepage</Dropdown.Item>
            <Dropdown.Item href="/profile">Profile</Dropdown.Item>
            <Dropdown.Item href="/projects">Projects</Dropdown.Item>
            {
              Object.keys(project).length ? 
                <Dropdown.Item
                  href="/project_info"
                >
                  Members
                </Dropdown.Item>  : <></>
            }
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    </Navbar>
  );
};

export default CustomNavbar;