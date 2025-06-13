CREATE DATABASE SIMA;

USE SIMA;

CREATE TABLE Staff_Relation (
	Staff_No      	    VarChar(4)   not null,
    Staff_Name     		VARCHAR(100) not null,
    Supervisor     		Char(4) 		 null,
    Date_Of_Birth  		Date         not null,
    Grade          		VarChar(5)   not null,
    Marital_Status 		Char(1)      not null,
    Pay    		   		Decimal(7,2)     null,
    Allowance    		Decimal(7,2)     null,
    Hourly_Rate  		Decimal(7,2)     null,
    Gender        		Char(1)      not null,
    Citizenship   		Varchar(10)  not null,
    Join_Yr        		Int          not null,
    Dept_Cd        		Varchar(5)   not null,
    Type_of_Employment  Char(2)      not null,
    Highest_Qln         Varchar(10)  not null,
    Designation         Varchar(20)  not null    
);

INSERT INTO staff_relation values
('S001','Anita','T002','1950/01/21','L1','D',7070,1000,Null,'F','Singapore','1996','DMIT','FT','Phd','Director'),
('S002','Apple','S001','1952/08/30','L1','S',6660,700,Null,'F','Korea','1980','DMIT','FT','BSc','Deputy Director'),
('S003','Charles','S001','1954/11/05','L2','M',5890,600,Null,'M','Malaysia','1990','DMIT','FT','BComp','Deputy Director'),
('S004','Dawn','S002','1956/02/21','L2','D',5200,200,Null,'F','Singapore','1982','DMIT','FT','MTech','Section Head'),
('S005','Edison','S002','1958/08/06','L3','W',4970,100,Null,'M','Taiwan','1988','DMIT','FT','MBA','Section Head'),
('S006','Fann','T002','1960/09/18','L1','M',7600,900,Null,'F','Malaysia','1978','SB','FT','ACA','Director'),
('S007','Gideon','S006','1962/10/10','L2','M',6000,600,Null,'M','Malaysia','1995','SB','FT','MPA','Deputy Director'),
('S008','Lionel','S007','1968/01/19','L3','D',5100,100,Null,'M','Singapore','1989','SB','FT','CFA','Section Head'),
('S009','Lee','S008','1965/01/26','L5A','D',Null,Null,120,'F','India','1997','SB','PT','CPA','Lecturer'),
('S010','Jason','S008','1968/11/30','L5','M',Null,Null,100,'M','China','1999','SB','PT','BBA','Lecturer'),
('S011','Andy','S007','1970/11/08','L3','M',5340,150,Null,'M','Thailand','2000','SB','FT','BA','Section Head'),
('S012','Edwin','S011','1975/09/09','L4','M',4950,Null,Null,'M','Hong Kong','2001','SB','FT','MA','Lecturer'),
('S017','Titus','S004','1960/03/19','L4A','S',2000,Null,Null,'M','Singapore','1985','DMIT','FT','MBIT','Lecturer'),
('S018','Derrick','S005','1971/09/05','L5A','S',3000,Null,Null,'M','Singapore','2007','DMIT','FT','MCM','Senior Lecturer'),
('S019','Eleanor','S004','1965/01/01','L4','S',Null,Null,120,'F','China','2008','DMIT','PT','BSE','Lecturer'),
('S020','Florence','S005','1968/01/01','L4','S',Null,Null,100,'F','China','2008','DMIT','PT','BDM','Lecturer'),
('T001','Bruce',null,'1960/05/15','SSD','S',9000,2000,Null,'M','Singapore','2008','PO','FT','BComp','Principal'),
('T002','Ruth','T001','1949/07/25','SSE','D',8500,1500,Null,'F','Singapore','1974','DPO','FT','BSc','Deputy Principal');
