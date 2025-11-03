
create table users(id char(30) primary key, role char(10), password text);
select * from Users;
create table api_endpoints (id serial primary key, env_id varchar(20),endpoint_name varchar(100),endpoint_url text,method varchar(10),description text);
insert into endpoints (env_id,endpoint_name,endpoint_url,method,description) values
('dev','sap-service','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/','POST','Base SAP service for CSRF and operations'),
('qa','sap-service','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/','POST','Base SAP service for CSRF and operations'),
('prod','sap-service','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/','POST','Base SAP service for CSRF and operations'),
('dev','sap-cancel','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZCANCELSet','POST','Cancel Gate Entry'),
('qa','sap-cancel','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZCANCELSet','POST','Cancel Gate Entry'),
('prod','sap-cancel','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZCANCELSet','POST','Cancel Gate Entry'),
('dev','sap-get-gateentry','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZGATE_ENTRYSet','GET','Fetch SAP Gate Entry data'),
('qa','sap-get-gateentry','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZGATE_ENTRYSet','GET','Fetch SAP Gate Entry data'),
('prod','sap-get-gateentry','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZGATE_ENTRYSet','GET','Fetch SAP Gate Entry data'),
('dev','sap-get-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','GET','BGet SAP Purchase Order data'),
('qa','sap-get-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','GET','Get SAP Purchase Order data'),
('prod','sap-get-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','GET','Get SAP Purchase Order data'),
('dev','sap-post-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','POST','Post SAP Purchase Order'),
('qa','sap-post-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','POST','Post SAP Purchase Order'),
('prod','sap-post-po','/sap/opu/odata/sap/ZGATE_ENTRY_SRV/ZHEADERSet','POST','Post SAP Purchase Order');
select * from api_endpoints;
SELECT * FROM api_endpoints WHERE endpoint_name = 'sap-get-po';
insert into users values ('Lokesh','admin','Lokesh@123'),
('User2','admin','User@123');

SELECT * FROM api_endpoints;



select * from Users;
insert into users values ('Super Admin','supadmin','Superadmin@123');

CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
  password TEXT NOT NULL
);
CREATE UNIQUE INDEX unique_superadmin
ON users ((role))
WHERE role = 'superadmin';

truncate table users;
INSERT INTO users (id, role, password)
VALUES ('Superadmin', 'superadmin', 'Superadmin@123');
