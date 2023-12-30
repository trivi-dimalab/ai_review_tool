# Use the official Node image as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the working directory
COPY . .

# Expose port 3000 for the React app
EXPOSE 3000


ARG REACT_APP_FLASK_IP
ENV REACT_APP_FLASK_IP=$REACT_APP_FLASK_IP
# Command to start the React app
CMD ["npm", "start"]
