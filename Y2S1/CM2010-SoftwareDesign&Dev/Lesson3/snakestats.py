def mean(vals):
    if len(vals) == 0:
        return None
    sum = 0.0
    for i in range(len(vals)):
        sum += vals[i]
    return sum / len(vals)

def getMax(vals):
    maxSeen = vals[0]
    for i in range(len(vals)):
        if vals[i] > maxSeen:
            maxSeen = vals[i]
    
    return maxSeen
