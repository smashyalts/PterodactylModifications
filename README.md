File Limit Changer and Pagination for Pterodactyl  

YOU CAN NOT USE BOTH AT THE SAME TIME  
Pagination completely bypasses the file limit, and after every 250 files a new page is created  
You need to have followed https://pterodactyl.io/community/customization/panel.html
atleast once.



Installation Guide  
File limit changer:  

Download FileLimitChanger.sh  
run *chmod +x FileLimitChanger.sh*  
then run *./FileLimitChanger.sh (new filelimit)*  
then run *yarn build:production*  
Do this as root to have proper permissions  


Pagination:  
Download FileManagerContainer.tsx  
Replace /www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx with the downloaded file  
then run *yarn build:production*  
