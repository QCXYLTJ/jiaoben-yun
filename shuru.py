import pyautogui
import time

# 定义坐标
a = (100, 200)
b = (300, 400)
c = (500, 600)

# 等待时间（给用户切换到目标窗口）
time.sleep(3)

# 在a坐标右键点击
pyautogui.moveTo(a[0], a[1], duration=0.5)  # 移动到a坐标
pyautogui.rightClick()  # 右键点击

# 在b坐标左键点击
pyautogui.moveTo(b[0], b[1], duration=0.5)  # 移动到b坐标
pyautogui.leftClick()  # 左键点击

# 输入文字
pyautogui.typewrite("xxx", interval=0.1)  # 自动输入文字 "xxx"

# 在c坐标左键点击
pyautogui.moveTo(c[0], c[1], duration=0.5)  # 移动到c坐标
pyautogui.leftClick()  # 左键点击

print("脚本执行完成！")