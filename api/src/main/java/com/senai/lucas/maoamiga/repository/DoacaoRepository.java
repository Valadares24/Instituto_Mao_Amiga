package com.senai.lucas.maoamiga.repository;

import com.senai.lucas.maoamiga.entity.Doacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DoacaoRepository extends JpaRepository<Doacao, UUID> {

    Page<Doacao> findByTipoItemContainingIgnoreCase(String tipoItem, Pageable pageable);
}
