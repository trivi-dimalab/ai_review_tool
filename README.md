# AI-Powered Literature Review Tool

Welcome to the AI-Powered Literature Review Tool, an advanced application designed to support researchers in efficiently conducting literature reviews. This tool leverages AI-driven chatbots to simplify the process of identifying research topics, questions, objectives, keywords, and other crucial information.

## Getting Started

### Prerequisites

Make sure you have the following installed on your development environment:

1. **Docker:** [Install Docker](https://docs.docker.com/get-docker/)
2. **Git:** [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## Installation

1. **Clone the project repository from GitHub:**

    ```bash
    git clone https://github.com/trivi-dimalab/ai_review_tool
    cd ai_review_tool
    ```

2. **Download the language model and place it inside the backend folder.**

## Update Configuration Files:

1. **Create a `.env` file from `.env.example`:**

    - Add your OpenAI key.
    - Update/keep information about the MongoDB connection.

2. **In the `docker-compose.yml` file:**

    - Maintain or set new ports for services (backend, frontend, mongo). By default, the backend runs on port 5000, frontend on port 3000, and MongoDB on port 27018. If you change the backend port, update the `REACT_APP_FLASK_IP` environment variable in the frontend service accordingly.

3. **For Scopus API:**

    - Create a `backend/pybliometrics.cfg` file from `backend/pybliometrics.example.cfg`. Obtain the API key from Scopus (information can be found at [Scopus Developer Portal](https://dev.elsevier.com/)).

## Usage

1. **Start the project for the first time:**

    ```bash
    docker-compose up --build
    ```

2. **To stop the project:**

    ```bash
    docker-compose down
    ```

3. **To restart the project:**

    ```bash
    docker-compose up -d
    ```

4. **Allow a couple of minutes to ensure all services are started successfully.**

5. **Access the tool through the website: [http://localhost:3000](http://localhost:3000)**

6. **For admin access, use the following credentials:**

    - **Username:** admin
    - **Password:** admin123

Enjoy using the AI-Powered Literature Review Tool! If you encounter any issues or have questions, please refer to the documentation or contact the administrator. Happy researching!
