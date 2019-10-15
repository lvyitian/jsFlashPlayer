TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

INCLUDEPATH += "/usr/include/llvm-c-6.0/"
INCLUDEPATH += "/usr/include/llvm-6.0/"

LIBS += -lLLVM-6.0
SOURCES += main.cpp
