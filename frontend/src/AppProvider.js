import React, {useState} from 'react';
import CustomModal from './components/CustomModal';
import CustomNotification from './components/CustomNotification';
import AppContext from './AppContext';
import CustomNavbar from './components/CustomNavBar';

const AppProvider = ({children}) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [showModal, setShowModal] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const [projects, setProjects] = useState(JSON.parse(localStorage.getItem('projects', [])) || []);
    const [project, setProject] = useState(JSON.parse(localStorage.getItem('project', {})) || {});

    const [modalInfo, setModalInfo] = useState({
        level: '',
        message: '',
        options: []
    })
    const [notiInfo, setNotiInfo] = useState({
        level: '',
        message: ''
    })

    const handleCloseModal = () => {
        setModalInfo({
            level: '',
            message: '',
            options: []
        }); 
        setShowModal(false);
    }

    const handleShowModal = (newModalInfo) => {
        setModalInfo(newModalInfo);
        setShowModal(true);
    }

    const handleShowNoti = (newNotiInfo) => {
        handleCloseModal();
        setNotiInfo(newNotiInfo);
        setShowNoti(true);

        setTimeout(() => {
            setNotiInfo({
                level: '',
                message: ''
            });
            setShowNoti(false);

            if (newNotiInfo['callback'])
                newNotiInfo['callback']();

        }, newNotiInfo.level == 'success' ? 1000 : 2000)
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('projects');
        localStorage.removeItem('project');
        setToken(null);
        setUsername(null);
        setRole(null);
        setProject({});
        setProjects([]);
    }

    const handleUpdateProjects = (projects) => {
        localStorage.setItem('projects', JSON.stringify(projects));
        setProjects(projects);

        const pro_ids = projects.map(item => {return item['pro_id']});

        if (project) {
            if (!pro_ids.includes(project['pro_id'])) {
                localStorage.removeItem('project');
                setProject({});
            }
        }
    }

    const handleUpdateProject = (project) => {
        localStorage.setItem('project', JSON.stringify(project));
        setProject(project);
    }

    const handleUpdateUser = (info) => {
        localStorage.setItem('token', info['token']);
        localStorage.setItem('username', info['username']);
        localStorage.setItem('role', info['role']);
        setToken(info['token']);
        setUsername(info['username']);
        setRole(info['role']);
    }
 
    const handleApiRequest = async (endpoint, method = 'GET', headers = {}, body, isFile=false, isJsonParse=true) => {
        try {
            // Add Authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`http://${process.env.REACT_APP_FLASK_IP}/${endpoint}`, {
                method,
                headers,
                body: body ? (isFile ? body : JSON.stringify(body)) : null,
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            if (isJsonParse) {
                const data = await response.json();
        
                // Check for 'error' property in the JSON response
                if (data.error) {

                    if (data.error == 'token') {
                        handleLogout();
                    }
                    throw new Error(data.message);
                }

                return data;
            } else {
                return response;
            }
        } catch (error) {

            handleShowNoti({
                level: 'error',
                message: error.message
            });

            throw error; // Propagate the error for the caller to handle if needed
        }
    };

    const contextValues = {
        token,
        username, 
        role,
        project,
        projects,
        handleUpdateProjects,
        handleUpdateProject,
        handleCloseModal,
        handleShowModal,
        handleShowNoti,
        handleLogout,
        handleUpdateUser,
        handleApiRequest
    }

    return (
        <AppContext.Provider value={contextValues}>
            {token ? <CustomNavbar/> : <></>}
            <CustomModal isShow={showModal} modalInfo={modalInfo} onClose={handleCloseModal}/> 
            <CustomNotification isShow={showNoti} notiInfo={notiInfo}/>
            {children}
        </AppContext.Provider>
    )
}

export default AppProvider;