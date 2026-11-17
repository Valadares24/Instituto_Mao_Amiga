package com.senai.lucas.maoamiga.repository;

import com.senai.lucas.maoamiga.entity.Ponto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PontoRepository extends JpaRepository<Ponto, UUID> {
}

