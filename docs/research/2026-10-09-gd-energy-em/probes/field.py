S = 5.670374419e-8
A = 456.45

def run(h, Tf, Tenv, C, K, Pin, T0=300.0, Tend=250.0, dt=1.0):
    T, t = T0, 0.0
    while T > Tend and t < 5 * 3600:
        q = Pin - h * A * (T - Tf) - K * S * (T**4 - Tenv**4)
        T += q / C * dt
        t += dt
    return t / 60, T

def eq(K, P, Tenv):
    return (P / (S * K) + Tenv**4) ** 0.25

for C in (25e6, 26.7e6):
    for K, kn in ((A, 'hull'), (A + 441, 'hull+passiveS')):
        for P, pn in ((0.2e6, 'hull only'), (0.2e6 * 2.495, 'diesel gen follows load'), (0.2e6 * 1.111, 'battery only')):
            for Tenv in (50, 250):
                res = [round(run(h, 50, Tenv, C, K, P)[0], 1) for h in (2, 5, 10, 15, 30)]
                print(f"C={C/1e6} {kn:14s} {pn:24s} Tenv={Tenv}: h=2,5,10,15,30 -> {res} min")
print()
for K, kn in ((A + 441, 'Sputnik/Pony/Mir-like'), (A + 882, 'Ermak 2 passive')):
    for P, pn in ((0.2e6, 'hull only'), (0.2e6 * 2.495, 'diesel'), (0.2e6 * 2.245, 'H2'), (0.2e6 * 1.111, 'E battery')):
        print(kn, pn, [round(eq(K, P, Te), 1) for Te in (3, 100, 250)])
print('Karavan', [round(eq(7303.2 + 1764, 3.2e6 * 2.495, Te), 1) for Te in (3, 250)], 'hull-only', [round(eq(7303.2 + 1764, 3.2e6, Te), 1) for Te in (3, 250)])
# EM ranges
Th = 7.2803e-13
import math
R = lambda W: math.sqrt(W / (4 * math.pi * Th)) / 1000
hull = 0.2e6
print('battery only 200kW', R(hull / 0.9 * 3e-10 + hull * 1e-10))
print('battery only 50kW', R(0.05e6 / 0.9 * 3e-10 + 0.05e6 * 1e-10))
g = 0.2e6 / 0.9 / 0.9
print('diesel min', R(g * 1e-9 + 2 * hull / 0.9 * 3e-10 + hull * 1e-10))
print('h2 min', R(g * 3e-10 + 2 * hull / 0.9 * 3e-10 + hull * 1e-10))
print('gyro +20kW @200', R((hull + 2e4) / 0.9 * 3e-10 + hull * 1e-10 + 2e4 * 1e-9))
print('gyro +20kW @50', R((0.05e6 + 2e4) / 0.9 * 3e-10 + 0.05e6 * 1e-10 + 2e4 * 1e-9))
print('TI 4MW + hull200', R((hull + 4e6) / 0.9 * 3e-10 + hull * 1e-10 + 4e6 * 1e-9))
print('e-furnace 0.87MW + hull200', R((hull + 0.87e6) / 0.9 * 3e-10 + hull * 1e-10 + 0.87e6 * 3e-10))
print('H2 furnace fan 20kW', R((hull + 2e4) / 0.9 * 3e-10 + hull * 1e-10 + 2e4 * 1e-9))
# battery 1% minutes
print('1% min', 0.01 * 14.73e9 * 0.9 / 0.2e6 / 60)
