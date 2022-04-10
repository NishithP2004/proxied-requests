# proxied-requests

Easily Rotate IP Addresses using open proxies while making HTTP requests. (Free Alternative to IP Rotate + Burp Intruder of Burp Suite written in Node.js)

## Steps To Use

- Install `Copy as Node.js Request` Burp extension from BApp Store.
  > ![image](https://user-images.githubusercontent.com/34577844/162638363-61e24a98-ff68-461e-8a7a-d7ecd2019e52.png)
- Intercept any request and `Copy as Node.js Request` (Accessed via a Request -> Action -> Copy as Node.js Request)
  > ![image](https://user-images.githubusercontent.com/34577844/162635230-3214e0ad-f280-4d06-a8be-62c8570077bf.png)
- Paste the copied request to the `request.txt` file available in this directory.
- Alternatively, the same can be manually parsed into `request.json` file.
- Run `node index.js`
- Enter the requested parameters: 

  > ![image](https://user-images.githubusercontent.com/34577844/162638166-00ea1fc6-5bed-48bd-b20f-ffc429806ed3.png)

  * **Port :** The port in which the program should serve the logs / provide the manual override kill switch (served via `/kill` in the specified port).
  * **Request Count :** Total number of requests to be made.
  * **Request Interval :** Interval between two consecutive requests (in ms). _**[Recommended 100 - 1000 ms]**_
  * **Parse request.txt :** Whether the program should parse `request.txt` or not ("no" when the request info is manually typed into request.json)
  * **Write output logs to log.txt :** Enable / Disable Logs (If true logs will be written in `log.txt` file and served via `/logs` in the specified port).

_PS. The program repeats the same valid IP Address till an error code of 429 (Too Many Requests) is emitted._

