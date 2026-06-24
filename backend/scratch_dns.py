import socket

try:
    print("Testing api.logmeal.es:", socket.gethostbyname("api.logmeal.es"))
except Exception as e:
    print("Error api.logmeal.es:", e)

try:
    print("Testing api.logmeal.com:", socket.gethostbyname("api.logmeal.com"))
except Exception as e:
    print("Error api.logmeal.com:", e)
