# Demo Video
https://github.com/user-attachments/assets/bb0fb63a-ec14-42b6-bedd-72814a38797e

# Key Design Points
-  I am using a typescript based framework because it is generally lighter to get off the ground than something like Spring Boot 🏃‍♂️‍➡️
- Deno is specifically used because it has typescript support built in and so removes the build step 🔧
- The sqlite database is embedded ⚠️
  - This is NOT production ready because the datastore is lost on container restart.
  - Running a database inside the container would have the same issue 🤷‍♂️
  - Apart from not spending time on infrastructure setup, a genuine _advantage_ to doing it this way is that each deployment can start from a fresh state allowing testing without clutter building up. 
  - The correct way to implement it would be to run a database like postgres externally.
- The queries are embedded inside the route handlers 🤮
  - while the site is small this is manageable but standard practice is to split these into a DAO layer and it would be the first refactor I would do.
- For some light interactivity I have used HTMX ✨
  - It is a lightweight option that I use on small personal projects. The core principle is to return HTML to the browser. If the site were to scale one could look at conerting to API endpoints returning JSON and rendering on the browser. The advantage of this is that it decouples the frontend logic from the backend and allows separate teams to work on each. But for a sample project like this it would have taken too long.
- There is some logging when adding invoices and items, for production I would look at externalising the logs to an aggregator so that they are not stuck in the container.
- I chose to implement email reminders instead of PDF export for two reasons 📋
  - It demonstrates that I know how to incorporate external services like Sendgrid
  - It demonstrates that I know how to handle secrets (the API key is not in the repo, it is stored in an environment variable on my droplet and loaded by docker-compose.yml)
- I have just realised that I forgot to add the crud to set an invoice as paid 🙈

# Quickstart
After cloning the repo, run:  
```deploy.sh <version>```  
Depending on how docker is installed, you may need to use `sudo`

The script will build the docker image and then ask whether or not to push to the registry.  
If you do not have credentials you will not be able to push a new version but you will be able to run it locally.

The hosted version of the site is availabe at:  
https://silson.dev/  
<img width="644" height="634" alt="image" src="https://github.com/user-attachments/assets/4f084796-fa0c-408b-8a2a-fdb23f6236f8" />  
The default login is:  
```test:test```  

# User Tutorial

Once logged in, click Invoices  
<img width="554" height="492" alt="image" src="https://github.com/user-attachments/assets/73260213-bc0e-475a-b0bc-e1bbd2ac89ad" />

You will see all the existing invoices listed:  
<img width="1497" height="581" alt="image" src="https://github.com/user-attachments/assets/147d83ed-5c4b-4d4f-8c95-4694f6afd314" />

Invoices can be in once of 3 states:
Paid
Pending (not yet due)
Overdue

Click on an invoice to see details:
<img width="1499" height="908" alt="image" src="https://github.com/user-attachments/assets/73f68532-5fb3-4838-8cc4-3cfe4cafdd36" />  

You can also send a reminder.  
If no email is entered then the one saved for the user is used.  
But you can enter your own email for testing.
<img width="1488" height="890" alt="image" src="https://github.com/user-attachments/assets/91fe951b-bded-46cb-b10d-0a6c47b9b7fc" />

Click on New Invoice to create:  
<img width="1486" height="610" alt="image" src="https://github.com/user-attachments/assets/b1f6d05c-d791-4044-abf3-fba070f4b84f" />  
<img width="1484" height="814" alt="image" src="https://github.com/user-attachments/assets/c65cfbc7-44cb-428c-b526-c2982f649d43" />  

Add New Items to the invoice:  
<img width="701" height="733" alt="image" src="https://github.com/user-attachments/assets/f95abbbe-9192-4acd-a48e-cb65c01df9e3" />





