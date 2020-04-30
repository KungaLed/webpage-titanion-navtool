#import rospy
#import numpy
import array
import sys
import os
import json

#import sensor_msgs.msg._NavSatFix
#from std_msgs import String
from sys import version as python_version
from cgi import parse_header, parse_multipart
#importing stuff depending on py version (might come in handy...)
if python_version.startswith('3'):
    from urllib.parse import parse_qs
    from http.server import HTTPServer, BaseHTTPRequestHandler
else:
    from urlparse import parse_qs
    from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler

PORT = 5120
#dictionary
pids = dict.fromkeys(["P","I","D"])
#gps-data(values at declaration = None)  initialized for test puposes here
#coordinates = dict.fromkeys(["lat","lon", "alt"])
coordinates = {"lat": 3.778543, "lon": 50.982023} 

def updatecoords():
    coordinates["lat"] += 0.00001
    #coordinates["lon"] += 0.0001
    print(coordinates["lat"])
    print(coordinates["lon"])

#subclass BaseHTTPRequestHandler
class Serv(BaseHTTPRequestHandler):
    def do_GET(self):
        #route incoming path to correct page
        if self.path in("","/"):
            self.path = "/webpage-titanion-navtool/index.html"

        if self.path == "/pid":
            self.path = "/webpage-titanion-navtool/pidtuner.html"
        
        if self.path == "/map":
            self.path = "/webpage-titanion-navtool/robotTracker/robotmapper.html"
        
        if self.path == "/robotmapper.css":
            self.path = "/webpage-titanion-navtool/robotTracker/robotmapper.css"

        if self.path == "/styles.css":
            self.path = "/webpage-titanion-navtool/styles.css"

        if self.path == "/pidtuner.js":
            self.path = "/webpage-titanion-navtool/pidtuner.js"

        if self.path == "/mapviewer.js":
            self.path = "/webpage-titanion-navtool/robotTracker/mapviewer.js"
       
        if self.path == "/img/header.jpg":
            self.path = "/webpage-titanion-navtool/img/header.jpg"

        if self.path == "/img/ILVOlogo.jpg":
            self.path = "/webpage-titanion-navtool/img/ILVOlogo.jpg"

        if "fonts/Flanders_Art_Sans_Light.ttf" in self.path:
            self.path = "/webpage-titanion-navtool/fonts/Flanders_Art_Sans_Light.ttf"

        if "fonts/Flanders_Art_Sans_Medium.ttf" in self.path:
            print("FONT SOUGHT")
            self.path = "/webpage-titanion-navtool/fonts/Flanders_Art_Sans_Medium.ttf"
        if "search-pointer" in self.path:
            print("ROBOT PIC SOUGHT")
            self.path = "/webpage-titanion-navtool/images/search-pointer.png"

              
        try:
            sendReply = False
            if self.path.endswith(".html"):
                mimetype = "utf-8"
                sendReply = True
            if self.path.endswith(".css"):
                mimetype = "text/css"
                sendReply = True            
            
            if self.path.endswith(".jpg"):
                mimetype = "image/jpg"
                sendReply = True 
            if self.path.endswith(".png"):
                mimetype = "image/png"
                sendReply = True

            if self.path.endswith(".js"):
                mimetype = "application/javascript"
                sendReply = True
            if self.path == "/fetch":
                mimetype = "utf-8"
                sendReply = True
            if self.path.endswith(".ttf"):
                mimetype = "application/x-font-woff"
                sendReply = True

            if sendReply == True:
                if self.path == "/fetch":
                    #to make sure elif , else not executed
                    print("FETCH called")
                elif mimetype == "image/jpg":
                    print("opening JPG FILE")
                    f = open(self.path[1:], "rb")
                elif mimetype == "image/png":
                    print("opening JPG FILE")
                    f = open(self.path[1:], "rb")
                else:
                    print("Opening anything BUT image file")             
                    f = open(self.path[1:])
                    
                self.send_response(200)
                self.send_header("Content-type",mimetype)
                self.end_headers()

                if self.path == "/fetch":
                    updatecoords()
                    jsonString = json.dumps(coordinates) + "\r\n"
                    self.wfile.write(jsonString.encode("utf-8"))
                elif mimetype == "image/jpg":
                    self.wfile.write(f.read())
                elif mimetype == "image/png":
                    self.wfile.write(f.read())
                else:
                    self.wfile.write(f.read().encode("utf-8"))
                #print(self.headers)
                
            return
        except IOError.with_traceback:
            not self.send_error(404, "File not found")


    def parse_POST(self):

        ctype, pdict = parse_header(self.headers['content-type'])
        if ctype == 'multipart/form-data':
            postvars = parse_multipart(self.rfile, pdict)
        elif ctype == 'application/x-www-form-urlencoded':
            length = int(self.headers['content-length'])
            postvars = parse_qs(
                    self.rfile.read(length), 
                    keep_blank_values=1,encoding='utf-8')
        else:
            postvars = {}
        return postvars

    def do_POST(self):

        if self.path == "/p":
            postvars = self.parse_POST()
            pids["P"] = int(postvars[b"P"][0])
        if self.path == "/i":
            postvars = self.parse_POST()
            pids["I"] = int(postvars[b"I"][0])
        if self.path == "/d":
            postvars = self.parse_POST()
            pids["D"] = int(postvars[b"D"][0])

        print(pids)
        self.send_response(200)
        self.send_header('Content-type',"utf-8")
        self.end_headers()
    
        
#def gpsGateway(msg):
    #read published data
    #lat = msg.latitude
    #lon = msg.longitude
    #alt = msg.altitude
    #store in dict
    #coordinates["lat"] = lat
    #coordinates["lon"] = lon
    #coordinates["alt"] = alt

  
if __name__=='__main__':  

    cwd = os.getcwd()
    files = os.listdir(cwd)
    print("Files in %r,: %s"%(cwd,files))
    print(os.path.dirname(sys.executable))

    #init rospy node
    #rospy.init_node('http_gateway_node')

    #init publisher, publishes one set of PID data 
    #everytime PID value's arrive from client
    #pid_pub = rospy.Publisher('/PID_pub',array.array('B') , queue_size = 10)
    #init subscriber: will store every last read-out of gpsdata in dictionary
    #gps_sub = rospy.Subscriber('/gga_pub',sensor_msgs.msg.NavSatFix, gpsGateway)

    #start server (server needs initiated publisher and subscriber to work with)
    httpd = HTTPServer(("localhost",PORT),Serv)
    httpd.serve_forever()




    



