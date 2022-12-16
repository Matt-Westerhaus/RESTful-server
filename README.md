## DB link:
https://uofstthomasmn-my.sharepoint.com/:u:/g/personal/west1114_stthomas_edu/EUxmh264MQRFvUEYowDn6XcBA7QjgL8dh-jVj878s5_IWA?e=eSMchx


## COPY AND PASTE FOR TESTING
/new-incident: (in terminal)
curl -X PUT "http://localhost:8000/new-incident" -H "Content-Type: application/json" -d "{\"case_number\":6, \"date\":\"2022-12-12\", \"time\":\"23:43:19\", \"code\":4, \"incident\":\"Auto Theft\", \"police_grid\":95, \"neighborhood_number\":4, \"block\":\"80X 6 ST E\"}"


/remove-incident: (in terminal)
curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d "{\"case_number\":4}"
