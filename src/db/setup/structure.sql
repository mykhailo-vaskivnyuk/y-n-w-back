--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 14.5

-- Started on 2022-11-17 14:49:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 209 (class 1259 OID 25071)
-- Name: nets; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.nets (
    net_id bigint NOT NULL,
    net_level integer DEFAULT 0 NOT NULL,
    parent_net_id bigint,
    first_net_id bigint,
    count_of_nets integer DEFAULT 1 NOT NULL,
    node_id bigint NOT NULL
);


ALTER TABLE public.nets OWNER TO merega;

--
-- TOC entry 210 (class 1259 OID 25076)
-- Name: nets_data; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.nets_data (
    net_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    goal text DEFAULT NULL::character varying,
    resource_name character varying(50) DEFAULT NULL::character varying,
    resource_link character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.nets_data OWNER TO merega;

--
-- TOC entry 211 (class 1259 OID 25090)
-- Name: nets_net_id_seq; Type: SEQUENCE; Schema: public; Owner: merega
--

ALTER TABLE public.nets ALTER COLUMN net_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nets_net_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 212 (class 1259 OID 25091)
-- Name: nets_users_data; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.nets_users_data (
    net_id bigint NOT NULL,
    user_id bigint NOT NULL,
    email_show bit(1) DEFAULT '0'::"bit" NOT NULL,
    name_show bit(1) DEFAULT '0'::"bit" NOT NULL,
    mobile_show bit(1) DEFAULT '0'::"bit" NOT NULL
);


ALTER TABLE public.nets_users_data OWNER TO merega;

--
--
-- Name: users_nodes_invites; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.users_nodes_invites (
    node_id bigint NOT NULL,
    user_id bigint NOT NULL,
    member_name character varying(50) NOT NULL,
    token character varying(255) NOT NULL
);

ALTER TABLE public.users_nodes_invites OWNER TO merega;

--
--
-- Name: users_members; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.users_members (
    user_id bigint NOT NULL,
    node_id bigint NOT NULL,
    dislike bit(1) DEFAULT '0'::"bit" NOT NULL
);


ALTER TABLE public.users_members OWNER TO merega;

--
-- TOC entry 213 (class 1259 OID 25097)
-- Name: nodes; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.nodes (
    node_id bigint NOT NULL,
    node_level integer DEFAULT 0 NOT NULL,
    node_position integer DEFAULT 0 NOT NULL,
    parent_node_id bigint,
    first_node_id bigint,
    count_of_members integer DEFAULT 0 NOT NULL,
    node_date timestamp without time zone NOT NULL,
    blocked bit(1) DEFAULT '0'::"bit" NOT NULL,
    changes bit(1) DEFAULT '0'::"bit" NOT NULL,
    user_id bigint
);


ALTER TABLE public.nodes OWNER TO merega;

--
-- TOC entry 214 (class 1259 OID 25105)
-- Name: nodes_node_id_seq; Type: SEQUENCE; Schema: public; Owner: merega
--

ALTER TABLE public.nodes ALTER COLUMN node_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nodes_node_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 215 (class 1259 OID 25106)
-- Name: sessions; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.sessions (
    session_id bigint NOT NULL,
    session_key character varying(255) NOT NULL,
    session_value character varying(255) NOT NULL
);


ALTER TABLE public.sessions OWNER TO merega;

--
-- TOC entry 216 (class 1259 OID 25111)
-- Name: sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: merega
--

ALTER TABLE public.sessions ALTER COLUMN session_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sessions_session_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 217 (class 1259 OID 25112)
-- Name: users; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    email character varying(50) NOT NULL,
    name character varying(50) DEFAULT NULL::character varying,
    mobile character varying(255) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.users OWNER TO merega;

--
-- TOC entry 219 (class 1259 OID 25167)
-- Name: users_tokens; Type: TABLE; Schema: public; Owner: merega
--

CREATE TABLE public.users_tokens (
    user_id bigint NOT NULL,
    confirm_token character varying(255),
    invite_token character varying(255) DEFAULT NULL::character varying,
    restore_token character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.users_tokens OWNER TO merega;

--
-- TOC entry 218 (class 1259 OID 25124)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: merega
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3218 (class 2606 OID 25126)
-- Name: nets pk_nets; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets
    ADD CONSTRAINT pk_nets PRIMARY KEY (net_id);


--
-- TOC entry 3222 (class 2606 OID 25128)
-- Name: nets_data pk_nets_data; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets_data
    ADD CONSTRAINT pk_nets_data PRIMARY KEY (net_id);


--
-- TOC entry 3224 (class 2606 OID 25130)
-- Name: nets_users_data pk_nets_users_data; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets_users_data
    ADD CONSTRAINT pk_nets_users_data PRIMARY KEY (net_id, user_id);


--
-- TOC entry 3226 (class 2606 OID 25132)
-- Name: nodes pk_nodes; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT pk_nodes PRIMARY KEY (node_id);


--
--
-- Name: users_nodes_invites pk_users_nodes_invites; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_nodes_invites
    ADD CONSTRAINT pk_users_nodes_invites PRIMARY KEY (node_id);
--  ADD CONSTRAINT uk_users_nodes_invites_token UNIQUE (token);


--
--
-- Name: users_members pk_users_members; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_members
    ADD CONSTRAINT pk_users_members PRIMARY KEY (user_id, node_id);


--
-- TOC entry 3228 (class 2606 OID 25134)
-- Name: sessions pk_sessions; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT pk_sessions PRIMARY KEY (session_id);


--
-- TOC entry 3230 (class 2606 OID 25136)
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (user_id);


--
-- TOC entry 3235 (class 2606 OID 25176)
-- Name: users_tokens pk_users_tokens; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_tokens
    ADD CONSTRAINT pk_users_tokens PRIMARY KEY (user_id);


--
-- TOC entry 3232 (class 2606 OID 25138)
-- Name: users uk_email; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_email UNIQUE (email);


--
-- TOC entry 3220 (class 2606 OID 25140)
-- Name: nets uk_nets_node; Type: CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets
    ADD CONSTRAINT uk_nets_node UNIQUE (node_id);


--
-- TOC entry 3233 (class 1259 OID 25141)
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: merega
--

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email);

--
--
-- Name: users_nodes_invites_token_idx; Type: INDEX; Schema: public; Owner: merega
--

CREATE UNIQUE INDEX users_nodes_invites_token_idx ON public.users_nodes_invites USING btree (token);

--
-- TOC entry 3237 (class 2606 OID 25142)
-- Name: nets_data fk_nets_data_net; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets_data
    ADD CONSTRAINT fk_nets_data_net FOREIGN KEY (net_id) REFERENCES public.nets(net_id) ON DELETE CASCADE;


--
-- TOC entry 3236 (class 2606 OID 25147)
-- Name: nets fk_nets_node; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets
    ADD CONSTRAINT fk_nets_node FOREIGN KEY (node_id) REFERENCES public.nodes(node_id);


--
-- TOC entry 3238 (class 2606 OID 25152)
-- Name: nets_users_data fk_nets_users_data_net; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets_users_data
    ADD CONSTRAINT fk_nets_users_data_net FOREIGN KEY (net_id) REFERENCES public.nets(net_id);


--
-- TOC entry 3239 (class 2606 OID 25157)
-- Name: nets_users_data fk_nets_users_data_user; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nets_users_data
    ADD CONSTRAINT fk_nets_users_data_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3240 (class 2606 OID 25162)
-- Name: nodes fk_nodes_user; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT fk_nodes_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
--
-- Name: users_nodes_invites fk_users_nodes_invites_node; Type: FK CONSTRAINT; Schema: public; Owner: merega
-- Name: users_nodes_invites fk_users_nodes_invites_user; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_nodes_invites
    ADD CONSTRAINT fk_users_nodes_invites_node FOREIGN KEY (node_id) REFERENCES public.nodes(node_id),
    ADD CONSTRAINT fk_users_nodes_invites_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
--
-- Name: users_members fk_users_members_user; Type: FK CONSTRAINT; Schema: public; Owner: merega
-- Name: users_members fk_users_members_node; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_members
    ADD CONSTRAINT fk_users_members_user FOREIGN KEY (user_id) REFERENCES public.users(user_id),
    ADD CONSTRAINT fk_users_members_node FOREIGN KEY (node_id) REFERENCES public.nodes(node_id);


--
-- TOC entry 3241 (class 2606 OID 25177)
-- Name: users_tokens fk_users_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: merega
--

ALTER TABLE ONLY public.users_tokens
    ADD CONSTRAINT fk_users_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2022-11-17 14:49:15

--
-- PostgreSQL database dump complete
--
